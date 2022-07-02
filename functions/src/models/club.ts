export interface Club {
    id: string;
    clubName: string;
    cityId: string;
    acceptedCurrency: string;
    clubImageUrl: string;
    reviewCount: number;
    reviewAvg: number;
    locationString: string;
    aboutUs?: string;
    phoneNumber: string;
    location: number[];
    socialMedia: { [key: string]: string };
}
