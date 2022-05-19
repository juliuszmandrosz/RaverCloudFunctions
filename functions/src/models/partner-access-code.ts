import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export  interface PartnerAccessCode {
    code: string;
    clubId: string;
    connectedAccountId: string;
    expirationDateTime: Timestamp;
}