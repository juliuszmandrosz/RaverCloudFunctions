interface WallPhoto {
    id: string;
    photoUrl: string;
    clubId: string;
    clubName: string;
    clubLocation: number[];
    eventId: string;
    eventName: string;
    userId: string;
    username: string;
    eventEndDateTime: number;
    createdAt: number;
    userProfilePhotoUrl?: string;
    photoLocation?: number[];
    isVerified: boolean;
}
