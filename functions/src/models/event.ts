export interface Event {
    id: string;
    eventName: string;
    clubId: string;
    clubName: string;
    eventStartDateTime: number;
    eventEndDateTime: number;
    originalStartDateTime: number;
    attending: number;
    minAge: number;
    price: number;
    currency: string;
    allowedOutfit: string;
    eventPhotoUrl: string;
    musicalGenres: string[];
    location: number[];
    urlLinks: { [key: string]: string };
    cityId: string;
    isConcert: boolean;
    isCanceled: boolean;
    isBeingPostponed: boolean;
    artistName?: string;
    description?: string;
}
