import CONSTANTS from "../../../constants";

import FirestoreService from "../../services/firestore.service";

export default class Repo {
    firestore: FirestoreService;

    constructor() {
        this.firestore = new FirestoreService(CONSTANTS.SETTINGS.COLLECTIONS.DEVICES);
    }

    create = (id: string, data: object) => {
        return this.firestore.write_by_id(
            id,
            data
        );
    }

    delete = (id: string) => {
        return this.firestore.delete_by_id(
            id
        );
    }

    get = (id: string) => {
        return this.firestore.get_by_id(
            id
        );
    }

    get_user_devices = (user_id: string) => {
        return this.firestore.select_by([
            { field: CONSTANTS.FIELDS.DEVICES.USER_ID, operator: '==', value: user_id }
        ]);
    }

    update = (id: string, data: object) => {
        return this.firestore.update_by_id(
            id,
            data
        );
    }
}