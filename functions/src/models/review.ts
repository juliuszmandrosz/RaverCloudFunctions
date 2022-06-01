import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface Review {
    id: string;
    dateAdded: Timestamp;
    userOpinion: string;
    userId: string;
    username: string;
    userRate: number;
}
