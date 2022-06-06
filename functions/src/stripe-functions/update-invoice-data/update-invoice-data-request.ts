export interface UpdateInvoiceDataRequest {
    name: string;
    isCompany: boolean;
    vatNumber?: string;
    countryCode?: string;
}
