import { CreateUpdateClubSalesOnEventEndParams } from './create-update-club-sales-on-event-end-params';
import { createCloudTask } from '../create-cloud-task';
import { UpdateClubSalesOnEventEndRequest } from '../../firestore-functions/update-club-sales/update-club-sales-on-event-end-request';
import * as moment from 'moment';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { updateClubSalesOnEventEndCallback } from '../../constants/cloud-tasks-callbacks';
import { updateClubSalesOnEventEndQueue } from '../../constants/cloud-queues';
import { getUpdateClubSalesTaskDocRef } from '../../firestore-functions/get-data/get-update-club-sales-task-data';
import { UpdateClubSalesTask } from '../../models/update-club-sales-task';

export async function createUpdateClubSalesOnEventEndTask({
    eventId,
    clubId,
    executesAt,
}: CreateUpdateClubSalesOnEventEndParams): Promise<string> {
    const payload: UpdateClubSalesOnEventEndRequest = {
        eventId,
        clubId,
    };

    const executionMoment = moment(executesAt.toMillis());

    const maxScheduleDate = moment().add(20, 'days').toDate();

    if (executionMoment.isAfter(maxScheduleDate)) {
        executesAt = Timestamp.fromDate(maxScheduleDate);
    }

    const updateClubSalesTaskId = await createCloudTask<UpdateClubSalesOnEventEndRequest>({
        payload,
        executesAt: executesAt,
        callbackName: updateClubSalesOnEventEndCallback,
        queueName: updateClubSalesOnEventEndQueue,
    });

    await getUpdateClubSalesTaskDocRef(eventId).set({
        updateClubSalesTaskId,
        executesAt,
    } as UpdateClubSalesTask);

    return updateClubSalesTaskId;
}
