export interface StripeCustomer {
    id: string;
    customerId: string;
    setupSecret: string;
    name?: string;
    vatNumber?: string;
}
