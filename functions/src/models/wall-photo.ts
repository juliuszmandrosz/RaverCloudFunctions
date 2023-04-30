interface WallPhoto {
    id: string;
    photoUrl: string;
    venueId: string;
    venueName: string;
    venueLocation: number[];
    userId: string;
    username: string;
    eventId: string;
    eventName: string;
    eventEndDateTime: number;
    createdAt: number;
    userProfilePhotoUrl?: string;
    photoLocation?: number[];
    isVerified: boolean;
}
