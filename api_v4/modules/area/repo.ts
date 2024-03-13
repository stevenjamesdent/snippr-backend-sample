import CONSTANTS from "../../../constants";

import FirestoreService from "../../services/firestore.service";

export default class Repo {
    firestore: FirestoreService;

    constructor() {
        this.firestore = new FirestoreService(CONSTANTS.SETTINGS.COLLECTIONS.AREAS);
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

    get_local_areas = (user_geohash_bounds: any) => {
        return this.firestore.select_by_geohash_bounds(
            user_geohash_bounds,
            CONSTANTS.FIELDS.AREAS.GEOHASH
        );
    }

    update = (id: string, data: object) => {
        return this.firestore.update_by_id(
            id,
            data
        );
    }
}