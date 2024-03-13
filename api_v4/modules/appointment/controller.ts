import CONSTANTS from "../../../constants";

import { Request } from "express";
import Service from "./service";

export default class Controller {
    service: Service;

    constructor() {
        this.service = new Service();
    }

    cancel_appointment = (request: Request) => {
        const appointment_id = request.params.appointment_id;

        return this.service.cancel_appointment(
            appointment_id
        );
    }

    create_appointment = (request: Request) => {
        const user_id = request.params.user_id;
        const data = request.body;

        return this.service.create_appointment(
            user_id,
            data
        );
    }

    get_appointments = (request: Request) => {
        const user_id = request.params.user_id;
        const start_date = request.params.start_date ?? null;
        const end_date = request.params.end_date ?? null;

        return this.service.get_appointments(
            user_id,
            start_date,
            end_date
        );
    }

    update_appointment = (request: Request) => {
        const appointment_id = request.params.appointment_id;
        const data = request.body;

        return this.service.update_appointment(
            appointment_id,
            data
        );
    }
}