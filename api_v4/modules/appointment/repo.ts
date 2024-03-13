import CONSTANTS from "../../../constants";

import FirestoreService from "../../services/firestore.service";

export default class Repo {
    firestore: FirestoreService;

    constructor() {
        this.firestore = new FirestoreService(CONSTANTS.SETTINGS.COLLECTIONS.APPOINTMENTS);
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

    get_user_appointments = (user_id: string, start_datetime: Date, end_datetime: Date) => {
        return this.firestore.select_by([
            { field: CONSTANTS.FIELDS.APPOINTMENTS.USER_ID, operator: '==', value: user_id },
            { field: CONSTANTS.FIELDS.APPOINTMENTS.FINISH_DATETIME, operator: '>=', value: start_datetime },
            { field: CONSTANTS.FIELDS.APPOINTMENTS.FINISH_DATETIME, operator: '<=', value: end_datetime }
        ]);
    }

    update = (id: string, data: object) => {
        return this.firestore.update_by_id(
            id,
            data
        );
    }
}