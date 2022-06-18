import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface UpdateClubSalesTask {
    /// Event id
    id: string;
    updateClubSalesTaskId: string;
    executesAt: Timestamp;
}
