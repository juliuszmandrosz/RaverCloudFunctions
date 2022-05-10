import { firestoreDatabase } from '../modules/firebase-admin-module';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;

export async function deleteQueryBatch(query: DocumentData) {
    const snapshot: DocumentData = await query.get();

    const batchSize = snapshot.size;

    if (batchSize === 0) return;

    const batch = firestoreDatabase().batch();

    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query);
    });
}
