import { tasksClient } from '../../modules/cloud-tasks-module';
import { getEventPayoutTaskDocRef } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { EventPayoutTask } from '../../models/event-payout-task';

interface CancelPayoutTaskParams {
    payoutTaskId: string;
    eventId: string;
}

export async function cancelPayoutTask({ payoutTaskId, eventId }: CancelPayoutTaskParams) {
    await tasksClient.deleteTask({ name: payoutTaskId });

    await getEventPayoutTaskDocRef(eventId).update({ isCanceled: true } as EventPayoutTask);
}
