import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { stripe } from '../../modules/stripe-module';
import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import UpdateData = firestore.UpdateData;
import { toJson } from '../../utils/json-utils';

export async function cancelUsersPaymentSessionsQueryBatch<T>(
    query: DocumentData,
    data: UpdateData<T>
) {
    const snapshot: DocumentData = await query.get();

    const batchSize = snapshot.size;

    if (batchSize === 0) return;

    const batch = firestoreDatabase().batch();

    const docs: QueryDocumentSnapshot[] = snapshot.docs;

    for (const doc of docs) {
        batch.update(doc.ref, toJson(data));
        await stripe.paymentIntents.cancel(doc.id);
    }

    await batch.commit();

    process.nextTick(() => {
        cancelUsersPaymentSessionsQueryBatch(query, data);
    });
}
