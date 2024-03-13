import CONSTANTS from "../../../constants";

import { Request } from "express";
import { User } from "../../../types/types.user";
import Service from "./service";
import UserService from "../user/service";

export default class Controller {
    service: Service;
    user_service: UserService;

    constructor() {
        this.service = new Service();
        this.user_service = new UserService();
    }
    
    is_covered = async (request: Request) => {
        const latitude = Number(request.params.latitude);
        const longitude = Number(request.params.longitude);
        const covering_users = await this.service.get_users_by_location_coverage(latitude, longitude);
        const profiles = await Promise.all(covering_users.map((user_id: string) => this.user_service.get(user_id)));

        return profiles?.filter(
            (profile: User) => (
                profile[CONSTANTS.FIELDS.USERS.VALID_STOREFRONT] &&
                profile[CONSTANTS.FIELDS.USERS.VALID_AVAILABILITY] &&
                profile[CONSTANTS.FIELDS.USERS.ACCOUNT_TYPE] !== CONSTANTS.SETTINGS.ACCOUNTS.TYPES.TEST
            )
        )?.length ? true : false;
    }
}