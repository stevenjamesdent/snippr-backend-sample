import CONSTANTS from "../../../constants";

import { Request } from "express";
import Service from "./service";

export default class Controller {
    service: Service;

    constructor() {
        this.service = new Service();
    }

    get_user_alerts = (request: Request) => {
        const user_id = request.params.user_id;

        return this.service.get_alerts(
            user_id
        );
    }

    mark_alert_actioned = (request: Request) => {
        const alert_id = request.params.alert_id;

        return this.service.mark_alert_actioned(
            alert_id
        );
    }

    mark_alerts_viewed = (request: Request) => {
        const alert_id_array = request.body;

        return this.service.mark_alerts_viewed(
            alert_id_array
        );
    }
}