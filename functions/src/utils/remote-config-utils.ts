import {firebaseRemoteConfig} from "../modules/firebase-admin-module";
import {ExplicitParameterValue} from "firebase-admin/lib/remote-config/remote-config-api";
import * as functions from "firebase-functions";

export async function getParameterFromRemoteConfig(parameter: string) {
    try {
        const config = await firebaseRemoteConfig().getTemplate()
        return (config.parameters[parameter].defaultValue as ExplicitParameterValue).value;
    } catch (e) {
        const message = 'Error fetching remote config';
        throw new functions.https.HttpsError('internal', message);
    }
}