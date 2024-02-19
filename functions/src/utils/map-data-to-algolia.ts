import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;


interface AlgoliaObject {
    objectID: string;
    _geoloc?: {
        lat: number;
        lng: number;
    };

    [key: string]: any;
}

export function mapDataToAlgolia(data: DocumentData, id: string) {
    const {location, ...rest} = data;

    const object: AlgoliaObject = {
        ...rest,
        objectID: id,
    }

    if (location && location.length === 2) {
        object._geoloc = {
            lat: location[0],
            lng: location[1],
        }
    }

    return object;
}
