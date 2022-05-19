import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export  interface PartnerAccessCode {
    clubId: string;
    connectedAccountId: string;
    expirationDateTime: Timestamp;
}