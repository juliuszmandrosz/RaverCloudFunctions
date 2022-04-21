export  interface AlgoliaEvent {
    id: string;
    eventName: string;
    clubId: string;
    clubName: string;
    eventStartDateTime: number;
    eventEndDateTime: number;
    attending: number;
    minAge: number;
    price: number;
    currency: string;
    allowedOutfit: string;
    musicalGenres: string[];
    location: Map<string, number>;
    urlLinks: Map<string, string>;
    cityId: string;
    isConcert: boolean;
    artistName?: string;
    description?: string;
    photos?: string[];
}