import { CustomClaims } from './custom-claims';

export interface Account {
    id: string;
    claims: CustomClaims;
}
