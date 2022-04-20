import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface Review{
    id: string;
    dateAdded: Timestamp;
    reviewContent: string;
    userId: string;
    username: string;
    reviewValue: number;
}