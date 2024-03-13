import CONSTANTS from "../../../constants";

import Repo from "./repo";
import SnipprID from "../../utils/snipprid.util";
import MomentHelper from '../../utils/moment.util';
import NotificationService from "../../services/notification.service";

export default class Service {
    repo: Repo;
    snippr_id: SnipprID;
    notification_service: NotificationService;
    moment: MomentHelper;
    alert_ttl: any;
    alert_ttl_expiry_datetime: Date;

    constructor() {
        this.repo = new Repo();
        this.snippr_id = new SnipprID(CONSTANTS.SETTINGS.UUIDS.ALERT);
        this.notification_service = new NotificationService();
        this.moment = new MomentHelper();
        this.alert_ttl = this.moment.ttl(CONSTANTS.SETTINGS.TTL.ALERTS);
        this.alert_ttl_expiry_datetime = this.moment.now().subtract(this.alert_ttl).toDate();
    }

    #id = () : string => {
        return this.snippr_id.generate_id();
    }

    create_alert = async (user_id: string, title: string, body: any, metadata: any = null, category: any = null, interactive: boolean = false, theme: any = null, notify: boolean = true) => {
        if (!user_id || !title || !body) {
            throw new Error('Alerts must have a user_id, title, and body');
        }

        return this.repo.create(
            this.#id(),
            {
                [CONSTANTS.FIELDS.ALERTS.ACTIONED]: false,
                [CONSTANTS.FIELDS.ALERTS.BODY]: body,
                [CONSTANTS.FIELDS.ALERTS.CATEGORY]: category ?? CONSTANTS.TERMS.ALERTS.CATEGORIES.GENERIC,
                [CONSTANTS.FIELDS.ALERTS.INTERACTIVE]: interactive,
                [CONSTANTS.FIELDS.ALERTS.METADATA]: metadata,
                [CONSTANTS.FIELDS.ALERTS.THEME]: theme ?? CONSTANTS.TERMS.ALERTS.THEMES.NEUTRAL,
                [CONSTANTS.FIELDS.ALERTS.TIMESTAMP]: new Date(),
                [CONSTANTS.FIELDS.ALERTS.TITLE]: title,
                [CONSTANTS.FIELDS.ALERTS.USER_ID]: user_id,
                [CONSTANTS.FIELDS.ALERTS.VIEWED]: false,
            }
        ).then(() => {
            if (notify) {
                this.notification_service.send(
                    user_id,
                    {
                        body: body,
                        metadata: JSON.stringify(metadata),
                        title: title,
                    }
                );
            }
        });
    }

    get_alerts = (user_id: string) => {
        return this.repo.get_user_alerts(
            user_id,
            this.alert_ttl_expiry_datetime
        );
    }

    mark_alert_actioned = (alert_id: string) => {
        return this.repo.update(
            alert_id,
            { [CONSTANTS.FIELDS.ALERTS.ACTIONED]: true }
        );
    }

    mark_alerts_viewed = (alert_id_array: [string]) => {
        return Promise.all(
            alert_id_array.map((alert_id) => this.repo.update(
                alert_id,
                { [CONSTANTS.FIELDS.ALERTS.VIEWED]: true }
            ))
        );
    }
}