import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Httpclient } from '../../Core/services/httpclient';

export interface CreateBugReportRequest {
    title: string;
    description: string;
    page?: string;
    steps?: string;
    browser?: string;
    email?: string;
}

export interface CreateBugReportResponse {
    id: number;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class BugReportService {
    private http = inject(Httpclient);

    /**
     * Submit a new bug report
     * POST /api/bug-reports
     */
    createBugReport(data: CreateBugReportRequest): Observable<CreateBugReportResponse> {
        return this.http.postJson<CreateBugReportResponse>('api/bug-reports', data);
    }
}

