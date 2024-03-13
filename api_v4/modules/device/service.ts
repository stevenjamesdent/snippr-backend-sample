import CONSTANTS from "../../../constants";

import { Device } from "../../../types/types.device";
import Repo from "./repo";
import SnipprID from "../../utils/snipprid.util";
import MomentHelper from "../../utils/moment.util";
import * as Moment from 'moment';

export default class Service {
    repo: Repo;
    snippr_id: SnipprID;
    moment: MomentHelper;
    stale_duration: Moment.Duration;

    constructor() {
        this.repo = new Repo();
        this.snippr_id = new SnipprID(CONSTANTS.SETTINGS.UUIDS.DEVICE);
        this.moment = new MomentHelper();
        this.stale_duration = this.moment.duration(2, 'month');
    }

    #id = (token: string) : string => {
        return this.snippr_id.generate_id(token);
    }

    create = (token: string, user_id: string) => {
        return this.repo.create(
            this.#id(token),
            {
                [CONSTANTS.FIELDS.DEVICES.TIMESTAMP]: new Date(),
                [CONSTANTS.FIELDS.DEVICES.TOKEN]: token,
                [CONSTANTS.FIELDS.DEVICES.USER_ID]: user_id,
            }
        );
    }

    get_user_devices = (user_id: string) => {
        return this.repo.get_user_devices(
            user_id
        ).then(
            (devices: Device[] | null) => devices?.filter(
                (device) => !this.is_stale(device)
            ).map((device) => device[CONSTANTS.FIELDS.DEVICES.TOKEN])
        );
    }

    is_stale = (device: Device) => {
        const timestamp = device[CONSTANTS.FIELDS.DEVICES.TIMESTAMP];
        const timestamp_moment = this.moment.timestamp_to_moment(timestamp);

        return timestamp_moment.isBefore(
            this.moment.now().subtract(this.stale_duration)
        );
    }
}