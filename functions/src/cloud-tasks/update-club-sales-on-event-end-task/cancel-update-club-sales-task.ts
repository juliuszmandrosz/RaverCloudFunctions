import { tasksClient } from '../../modules/cloud-tasks-module';
import {
    getUpdateClubSalesTaskDocRef,
    tryGetUpdateClubSalesTaskData,
} from '../../firestore-functions/get-data/get-update-club-sales-task-data';

export async function cancelUpdateClubSalesTask(eventId: string) {
    const updateClubSalesTask = await tryGetUpdateClubSalesTaskData(eventId);
    await tasksClient.deleteTask({ name: updateClubSalesTask.updateClubSalesTaskId });
    await getUpdateClubSalesTaskDocRef(eventId).delete();
}
