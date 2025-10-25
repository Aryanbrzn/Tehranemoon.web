export interface CreatePlaceRequestDto {
    name: string;
    description?: string;
    categoryId: number;
    instagramUrl?: string;
}

export interface PlaceRequestDto {
    id: number;
    name: string;
    description?: string;
    categoryId: number;
    categoryName: string;
    instagramUrl?: string;
    submittedByUserId?: number;
    submittedByUserName?: string;
    status: PlaceRequestStatus;
    adminNotes?: string;
    reviewedAtUtc?: Date;
    reviewedByUserId?: number;
    reviewedByUserName?: string;
    convertedToPlaceId?: number;
    convertedToPlaceTitle?: string;
    createdAtUtc: Date;
    updatedAtUtc?: Date;
}

export enum PlaceRequestStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Converted = 3
}

export interface PlaceRequestSubmissionResult {
    id: number;
    message: string;
}
