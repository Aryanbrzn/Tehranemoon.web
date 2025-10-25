import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Httpclient } from '../../Core/services/httpclient';
import { CreatePlaceRequestDto, PlaceRequestDto, PlaceRequestSubmissionResult } from './place-request.models';

@Injectable({ providedIn: 'root' })
export class PlaceRequestService {
    private http = inject(Httpclient);

    /**
     * Submit a new place request
     * POST /api/place-requests
     */
    submitPlaceRequest(data: CreatePlaceRequestDto): Observable<PlaceRequestSubmissionResult> {
        return this.http.postJson<PlaceRequestSubmissionResult>('api/place-requests', data);
    }

    /**
     * Get user's submitted place requests
     * GET /api/place-requests/my-requests
     */
    getMyRequests(): Observable<PlaceRequestDto[]> {
        return this.http.get<PlaceRequestDto[]>('api/place-requests/my-requests');
    }

    /**
     * Get details of a specific place request
     * GET /api/place-requests/{id}
     */
    getRequestDetails(id: number): Observable<PlaceRequestDto> {
        return this.http.get<PlaceRequestDto>(`api/place-requests/${id}`);
    }
}
