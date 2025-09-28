import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../tokens';
import { map } from 'rxjs/operators';

type QueryValue = string | number | boolean | Date | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

@Injectable({
  providedIn: 'root'
})
export class Httpclient {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get<T>(path: string, params?: QueryParams) {
    const url = this.url(path);
    const httpParams = this.buildHttpParams(params);
    return this.http.get<T>(url, { params: httpParams })
      .pipe(this.deepEscapeOperator<T>());
  }

  delete<T>(path: string, params?: QueryParams) {
    const url = this.url(path);
    const httpParams = this.buildHttpParams(params);
    return this.http.delete<T>(url, { params: httpParams })
      .pipe(this.deepEscapeOperator<T>());
  }

  postJson<T>(path: string, body: any) {
    const url = this.url(path);
    const clean = this.sanitizeOutbound(body);
    return this.http.post<T>(url, clean)
      .pipe(this.deepEscapeOperator<T>());
  }

  /**
  * POST multipart/form-data
  * - Accepts an existing FormData or a plain object (auto-converted).
  * - For files, pass File/Blob; for arrays, append repeated keys.
  */
  postForm<T>(path: string, form: FormData | Record<string, any>) {
    const url = this.url(path);
    const fd = form instanceof FormData ? this.sanitizeFormData(form) : this.toFormData(form);
    return this.http.post<T>(url, fd)
      .pipe(this.deepEscapeOperator<T>());
  }

  putJson<T>(path: string, body: any) {
    const url = this.url(path);
    const clean = this.sanitizeOutbound(body);
    return this.http.put<T>(url, clean)
      .pipe(this.deepEscapeOperator<T>());
  }

  /** PATCH JSON ([FromBody]) */
  patchJson<T>(path: string, body: any) {
    const url = this.url(path);
    const clean = this.sanitizeOutbound(body);
    return this.http.patch<T>(url, clean)
      .pipe(this.deepEscapeOperator<T>());
  }

  // -------------------- HELPERS --------------------

  /** Build absolute URL from base + path */
  private url(path: string) {
    if (!path) return this.baseUrl;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const b = this.baseUrl?.replace(/\/+$/, '') ?? '';
    const p = path.replace(/^\/+/, '');
    return `${b}/${p}`;
  }

  /** Build HttpParams that ASP.NET Core [FromQuery] loves (repeat keys for arrays) */
  private buildHttpParams(params?: QueryParams) {
    let hp = new HttpParams();
    if (!params) return hp;

    const appendOne = (key: string, value: QueryValue) => {
      if (value === undefined || value === null) return;
      const s = this.toParamString(value);
      hp = hp.append(key, s);
    };

    for (const key of Object.keys(params)) {
      const v = params[key];
      if (Array.isArray(v)) {
        v.forEach(item => appendOne(key, item));
      } else {
        appendOne(key, v as QueryValue);
      }
    }
    return hp;
  }

  /** Convert value to query string; Dates -> UTC ISO */
  private toParamString(v: QueryValue): string {
    if (v instanceof Date) return new Date(Date.UTC(
      v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(),
      v.getUTCHours(), v.getUTCMinutes(), v.getUTCSeconds(), v.getUTCMilliseconds()
    )).toISOString();
    return String(v);
  }

  /** Recursively sanitize outbound JSON (trim strings, strip script tags/JS URLs, normalize dates to UTC ISO) */
  private sanitizeOutbound<T>(data: T): T {
    const seen = new WeakSet<object>();
    const walk = (val: any): any => {
      if (val === null || val === undefined) return val;

      if (typeof val === 'string') {
        // trim + collapse dangerous content
        const trimmed = val.trim();
        return this.stripScripts(trimmed);
      }
      if (val instanceof Date) {
        return new Date(Date.UTC(
          val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate(),
          val.getUTCHours(), val.getUTCMinutes(), val.getUTCSeconds(), val.getUTCMilliseconds()
        )).toISOString();
      }
      if (Array.isArray(val)) return val.map(walk);

      if (typeof val === 'object') {
        if (seen.has(val)) return val; // prevent cycles
        seen.add(val);
        const out: any = {};
        for (const k of Object.keys(val)) {
          const v = (val as any)[k];
          if (v === undefined) continue; // drop undefined
          out[k] = walk(v);
        }
        return out;
      }
      return val;
    };
    return walk(data);
  }

  /** Convert plain object to FormData (sanitizing strings & filenames) */
  private toFormData(model: Record<string, any>, fd = new FormData(), prefix = ''): FormData {
    const keyOf = (k: string) => prefix ? `${prefix}.${k}` : k;

    for (const k of Object.keys(model || {})) {
      const v = model[k];
      if (v === undefined || v === null) continue;

      // Files
      if (v instanceof File || v instanceof Blob) {
        const name = v instanceof File ? this.safeFilename(v.name) : 'blob';
        fd.append(keyOf(k), v, name);
        continue;
      }

      // Dates
      if (v instanceof Date) {
        fd.append(keyOf(k), this.toUtcIso(v)); // ⬅️ was sanitizeOutbound(v)
        continue;
      }

      if (Array.isArray(v)) {
        for (const item of v) {
          if (item === undefined || item === null) continue;
          if (item instanceof File || item instanceof Blob) {
            const name = item instanceof File ? this.safeFilename(item.name) : 'blob';
            fd.append(keyOf(k), item, name);
          } else if (item instanceof Date) {
            fd.append(keyOf(k), this.toUtcIso(item)); // ⬅️ was sanitizeOutbound(item)
          } else if (typeof item === 'object') {
            // For complex array items, send JSON string
            fd.append(keyOf(k), JSON.stringify(this.sanitizeOutbound(item)));
          } else {
            fd.append(keyOf(k), this.stripScripts(String(item)));
          }
        }
        continue;
      }

      if (typeof v === 'object') {
        // For nested objects, serialize as JSON string (stable & simple for [FromForm])
        fd.append(keyOf(k), JSON.stringify(this.sanitizeOutbound(v)));
        continue;
      }

      // primitives
      fd.append(keyOf(k), this.stripScripts(String(v)));
    }
    return fd;
  }

  /** Sanitize an existing FormData (strings & filenames only) */
  private sanitizeFormData(fd: FormData): FormData {
    const out = new FormData();
    // NOTE: FormData iteration is supported in modern browsers
    (fd as any).forEach((value: any, key: string) => {
      if (value instanceof File || value instanceof Blob) {
        const name = value instanceof File ? this.safeFilename(value.name) : 'blob';
        out.append(key, value, name);
      } else if (value instanceof Date) {
        out.append(key, this.toUtcIso(value)); // ⬅️ was sanitizeOutbound(value)
      } else {
        out.append(key, this.stripScripts(String(value)));
      }
    });
    return out;
  }
  private toUtcIso(d: Date): string {
    return new Date(Date.UTC(
      d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
      d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()
    )).toISOString();
  }

  private safeFilename(name: string) {
    const n = (name || '').replace(/^.*[\\/]/, ''); // drop path
    return n.replace(/[^\w.\-()+\s]/g, '_').slice(0, 180);
  }

  /** Strip obvious <script> tags, on* handlers, and javascript: URLs from outbound strings */
  private stripScripts(s: string): string {
    // remove <script>…</script>
    s = s.replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
    // remove on*="..." attributes (simple)
    s = s.replace(/\son\w+="[^"]*"/gi, '').replace(/\son\w+='[^']*'/gi, '');
    // neuter javascript: URLs
    s = s.replace(/javascript\s*:/gi, '');
    return s;
  }

  /** Escape inbound strings to neutralize HTML/JS before they hit templates (defense-in-depth) */
  private deepEscape<T>() {
    const seen = new WeakSet<object>();
    const walk = (val: any): any => {
      if (val === null || val === undefined) return val;
      if (typeof val === 'string') return this.escapeHtml(val);
      if (Array.isArray(val)) return val.map(walk);
      if (val instanceof Date) return val; // assume already a Date if any
      if (typeof val === 'object') {
        if (seen.has(val)) return val;
        seen.add(val);
        const out: any = {};
        for (const k of Object.keys(val)) {
          out[k] = walk(val[k]);
        }
        return out;
      }
      return val;
    };
    return walk;
  }

  /** RxJS operator to deep-escape response bodies */

  private deepEscapeOperator<T>() {
    const escape = this.deepEscape<T>();
    return map<T, T>((v) => escape(v));
  }

  /** Minimal HTML escaper (for safe text rendering) */
  private escapeHtml(s: string): string {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
      .replaceAll('/', '&#x2F;');
  }

}
