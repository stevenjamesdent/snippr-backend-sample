import CONSTANTS from "../../../constants";

import FirestoreService from "../../services/firestore.service";

export default class Repo {
    firestore: FirestoreService;

    constructor() {
        this.firestore = new FirestoreService(CONSTANTS.SETTINGS.COLLECTIONS.ALERTS);
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

    get_user_alerts = (user_id: string, ttl_expiry_datetime: Date) => {
        return this.firestore.select_by(
            [
                { field: CONSTANTS.FIELDS.ALERTS.USER_ID, operator: '==', value: user_id },
                { field: CONSTANTS.FIELDS.ALERTS.TIMESTAMP, operator: '>', value: ttl_expiry_datetime }
            ],
            { field: CONSTANTS.FIELDS.ALERTS.TIMESTAMP, order: 'desc' }
        );
    }

    update = (id: string, data: object) => {
        return this.firestore.update_by_id(
            id,
            data
        );
    }
}