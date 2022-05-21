import { TicketPool } from './ticket-pool';

export interface Event {
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
    _geoloc: { [key: string]: number };
    urlLinks: { [key: string]: string };
    cityId: string;
    isConcert: boolean;
    ticketPools: TicketPool[];
    artistName?: string;
    description?: string;
    photos?: string[];
}
