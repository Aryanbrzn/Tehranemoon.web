import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

export interface SEOData {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
    author?: string;
    structuredData?: any;
}

@Injectable({
    providedIn: 'root'
})
export class SEOService {
    private titleService = inject(Title);
    private metaService = inject(Meta);
    private baseUrl = environment.webUrl;
    private dynamicStructuredDataScript: HTMLScriptElement | null = null;

    /**
     * Update SEO meta tags for the current page
     */
    updateTags(data: SEOData): void {
        const title = data.title || 'تهرانمون - راهنمای بهترین مکان‌های تهران';
        const description = data.description || 'تهرانمون پلتفرمی برای کشف بهترین مکان‌های تهران. از رستوران‌های محلی تا جاذبه‌های گردشگری، نقشه تعاملی، امتیازدهی و نظرات کاربران.';
        const keywords = data.keywords || 'تهرانمون, مکان‌های تهران, رستوران تهران, جاذبه‌های تهران, نقشه تهران';
        const image = data.image || `${this.baseUrl}/images/tehran.png`;
        const url = data.url || window.location.href;
        const type = data.type || 'website';

        // Update title
        this.titleService.setTitle(title);

        // Update or create primary meta tags
        this.updateOrCreateMetaTag('name', 'title', title);
        this.updateOrCreateMetaTag('name', 'description', description);
        this.updateOrCreateMetaTag('name', 'keywords', keywords);
        if (data.author) {
            this.updateOrCreateMetaTag('name', 'author', data.author);
        }

        // Update Open Graph tags
        this.updateOrCreateMetaTag('property', 'og:title', title);
        this.updateOrCreateMetaTag('property', 'og:description', description);
        this.updateOrCreateMetaTag('property', 'og:image', image);
        this.updateOrCreateMetaTag('property', 'og:url', url);
        this.updateOrCreateMetaTag('property', 'og:type', type);
        this.updateOrCreateMetaTag('property', 'og:image:alt', title);

        // Update Twitter Card tags
        this.updateOrCreateMetaTag('name', 'twitter:title', title);
        this.updateOrCreateMetaTag('name', 'twitter:description', description);
        this.updateOrCreateMetaTag('name', 'twitter:image', image);
        this.updateOrCreateMetaTag('name', 'twitter:image:alt', title);
        this.updateOrCreateMetaTag('name', 'twitter:url', url);

        // Update canonical URL
        this.updateCanonicalUrl(url);

        // Add structured data if provided
        if (data.structuredData) {
            this.addStructuredData(data.structuredData);
        }
    }

    /**
     * Update or create a meta tag
     */
    private updateOrCreateMetaTag(attr: 'name' | 'property', selector: string, content: string): void {
        const existingTag = this.metaService.getTag(`${attr}="${selector}"`);
        if (existingTag) {
            this.metaService.updateTag({ [attr]: selector, content });
        } else {
            this.metaService.addTag({ [attr]: selector, content });
        }
    }

    /**
     * Update canonical URL
     */
    private updateCanonicalUrl(url: string): void {
        let link: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }

    /**
     * Add structured data (JSON-LD)
     */
    private addStructuredData(data: any): void {
        // Remove only the dynamic structured data script we added (not the base ones from index.html)
        if (this.dynamicStructuredDataScript && this.dynamicStructuredDataScript.parentNode) {
            this.dynamicStructuredDataScript.parentNode.removeChild(this.dynamicStructuredDataScript);
        }

        // Add new structured data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-dynamic', 'true'); // Mark as dynamic
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
        this.dynamicStructuredDataScript = script;
    }

    /**
     * Set default SEO tags (home page)
     */
    setDefaultTags(): void {
        this.updateTags({
            title: 'تهرانمون - راهنمای بهترین مکان‌های تهران',
            description: 'تهرانمون پلتفرمی برای کشف بهترین مکان‌های تهران. از رستوران‌های محلی تا جاذبه‌های گردشگری، نقشه تعاملی، امتیازدهی و نظرات کاربران. راهنمای کامل شما برای تهران زیبا.',
            keywords: 'تهرانمون, مکان‌های تهران, رستوران تهران, جاذبه‌های تهران, نقشه تهران, راهنمای تهران, بهترین مکان‌های تهران, گردشگری تهران',
            url: this.baseUrl
        });
    }
}

