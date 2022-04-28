import { protos } from '@google-cloud/tasks';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { tasksClient } from '../modules/cloud-tasks-module';
import { functionsEndpoint, functionsLocation, projectId } from '../constants/platform-constants';

export interface CreateCloudTaskParams<T> {
    payload: T;
    queueName: string;
    callbackName: string;
    executionTimeInSeconds?: number;
    executesAt?: Timestamp;
}

/// Returns task id
export async function createCloudTask<T>(params: CreateCloudTaskParams<T>): Promise<string> {
    const queuePath = tasksClient.queuePath(projectId, functionsLocation, params.queueName);

    const task = getCloudTaskBody(params);

    const [response] = await tasksClient.createTask({ parent: queuePath, task });

    return response.name!;
}

function getCloudTaskBody<T>(params: CreateCloudTaskParams<T>) {
    return {
        httpRequest: {
            httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
            url: getUrl(params),
            body: getPayloadBody(params.payload),
            headers: {
                'Content-Type': 'application/json',
            },
        },
        scheduleTime: {
            seconds: getScheduleTime(params),
        },
    };
}

function getUrl<T>(params: CreateCloudTaskParams<T>) {
    return `${functionsEndpoint}${params.callbackName}`;
}

function getPayloadBody<T>(payload: T) {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function getScheduleTime<T>(params: CreateCloudTaskParams<T>) {
    if (params.executionTimeInSeconds) {
        return Date.now() / 1000 + params.executionTimeInSeconds;
    }

    if (params.executesAt) {
        return params.executesAt.seconds;
    }

    return Timestamp.now().seconds;
}
