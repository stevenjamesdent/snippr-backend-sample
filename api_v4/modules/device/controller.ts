import CONSTANTS from "../../../constants";

import { Request } from "express";
import Service from "./service";

export default class Controller {
    service: Service;

    constructor() {
        this.service = new Service();
    }

    create = (request: Request) => {
        const token = request.params.token;
        const user_id = request.params.user_id;

        return this.service.create(
            token,
            user_id
        );
    }
}