import CONSTANTS from "../../../constants";

import Repo from "./repo";
import SnipprID from "../../utils/snipprid.util";
import { Appointment } from "../../../types/types.appointment";
import { isString } from "lodash";
import GeoService from "../../services/geo.service";
import MomentHelper from "../../utils/moment.util";
import { Booking } from "../../../types/types.booking";

export default class Service {
    repo: Repo;
    snippr_id: SnipprID;
    geo_service: GeoService;
    moment: MomentHelper;

    constructor() {
        this.repo = new Repo();
        this.snippr_id = new SnipprID(CONSTANTS.SETTINGS.UUIDS.APPOINTMENT);
        this.geo_service = new GeoService();
        this.moment = new MomentHelper();
    }

    #id = () : string => {
        return this.snippr_id.generate_id();
    }

    #appointment_as_range = async (appointment: Appointment, adjacent_latlong: [number, number] | null = null) => {
        const range = this.moment.get_range(
            this.moment.timestamp_to_moment(appointment[CONSTANTS.FIELDS.APPOINTMENTS.START_DATETIME]),
            this.moment.timestamp_to_moment(appointment[CONSTANTS.FIELDS.APPOINTMENTS.FINISH_DATETIME])
        );

        if (adjacent_latlong) {
            const travel_time_seconds = await this.geo_service.get_travel_time(
                { latitude: appointment[CONSTANTS.FIELDS.APPOINTMENTS.LOCATION][CONSTANTS.FIELDS.LOCATIONS.LATITUDE], longitude: appointment[CONSTANTS.FIELDS.APPOINTMENTS.LOCATION][CONSTANTS.FIELDS.LOCATIONS.LONGITUDE] },
                { latitude: adjacent_latlong[0], longitude: adjacent_latlong[1] }
            );

            range.start.subtract(travel_time_seconds, 'second');
            range.end.add(travel_time_seconds, 'second');
        }
        
        return range;
    }

    #sanitise_appointment = async (appointment_id: string) => {
        const appointment = await this.repo.get(appointment_id);

        if (
            isString(appointment[CONSTANTS.FIELDS.APPOINTMENTS.START_DATETIME]) ||
            isString(appointment[CONSTANTS.FIELDS.APPOINTMENTS.FINISH_DATETIME])
        ) {
            return this.repo.update(
                appointment_id,
                {
                    [CONSTANTS.FIELDS.APPOINTMENTS.START_DATETIME]: new Date(appointment[CONSTANTS.FIELDS.APPOINTMENTS.START_DATETIME]),
                    [CONSTANTS.FIELDS.APPOINTMENTS.FINISH_DATETIME]: new Date(appointment[CONSTANTS.FIELDS.APPOINTMENTS.FINISH_DATETIME]),
                }
            );
        } else return true;
    }
    
    cancel_appointment = (appointment_id: string) => {
        return this.repo.delete(
            appointment_id
        );
    }
    
    check_for_conflicts = async (appointment_data: Appointment, bookings: Booking[]) => {
        let conflicted_bookings: Booking[] = [];
        
        await Promise.all(bookings.map(async (booking) => {
            let booking_conflicted = false;
            
            const appointment_range = await this.#appointment_as_range(appointment_data, booking[CONSTANTS.FIELDS.BOOKINGS.LOCATION]);
            const booking_range = this.moment.get_range(
                this.moment.timestamp_to_moment(booking[CONSTANTS.FIELDS.BOOKINGS.START_DATETIME]!),
                this.moment.timestamp_to_moment(booking[CONSTANTS.FIELDS.BOOKINGS.FINISH_DATETIME]!)
            );

            if (appointment_range.overlaps(booking_range)) {
                booking_conflicted = true;
            }

            booking_conflicted && conflicted_bookings.push(booking);
        }));

        return conflicted_bookings?.length 
                    ? conflicted_bookings.map((booking) => booking[CONSTANTS.FIELDS.BOOKINGS.SNIP_ID])
                    : false;
    }
    
    create_appointment = async (user_id: string, data: Appointment) => {
        const appointment_id = this.#id();

        return this.repo.create(
            appointment_id,
            {
                ...data,
                [CONSTANTS.FIELDS.APPOINTMENTS.USER_ID]: user_id,
            }
        ).then(() => this.#sanitise_appointment(appointment_id));
    }

    get_appointments = async (user_id: string, start_date: string | null = null, end_date: string | null = null) => {
        const start_moment = start_date ? this.moment.date_as_moment(start_date) : this.moment.now();
        const end_moment = end_date ? this.moment.date_as_moment(end_date).endOf('day') : start_moment.clone().endOf('day');
        const appointments = await this.repo.get_user_appointments(
            user_id,
            start_moment.toDate(),
            end_moment.toDate()
        );

        return appointments?.sort(this.sort_appointments);
    }

    get_appointment_ranges_for_date = async (user_id: string, date: string, latlong: [number, number]) => {
        const appointments = await this.get_appointments(user_id, date, date);

        if (!appointments) return null;

        return Promise.all(appointments.map((appointment) =>
            this.geo_service.get_travel_time(
                { latitude: appointment[CONSTANTS.FIELDS.APPOINTMENTS.LOCATION][CONSTANTS.FIELDS.LOCATIONS.LATITUDE], longitude: appointment[CONSTANTS.FIELDS.APPOINTMENTS.LOCATION][CONSTANTS.FIELDS.LOCATIONS.LONGITUDE] },
                { latitude: latlong[0], longitude: latlong[1] }
            ).then((travel_time_seconds) => {
                const start_moment = this.moment.timestamp_to_moment(appointment[CONSTANTS.FIELDS.APPOINTMENTS.START_DATETIME]);
                const finish_moment = this.moment.timestamp_to_moment(appointment[CONSTANTS.FIELDS.APPOINTMENTS.FINISH_DATETIME]);
                const start_time = start_moment.format(CONSTANTS.SETTINGS.MOMENT.FORMATS.TIME.UTIL);
                const finish_time = finish_moment.format(CONSTANTS.SETTINGS.MOMENT.FORMATS.TIME.UTIL);

                return this.moment.get_range(
                    this.moment.time_as_moment(start_time).subtract(travel_time_seconds, 'second'),
                    this.moment.time_as_moment(finish_time).add(travel_time_seconds, 'second')
                );
            })
        ));
    }

    sort_appointments = (appointment_a: Appointment, appointment_b: Appointment) => {
        const [appointment_a_start, appointment_b_start] = [
            this.moment.timestamp_to_moment(appointment_a[CONSTANTS.FIELDS.APPOINTMENTS.START_DATETIME]),
            this.moment.timestamp_to_moment(appointment_b[CONSTANTS.FIELDS.APPOINTMENTS.START_DATETIME])
        ];

        if (appointment_a_start.isBefore(appointment_b_start)) {
            return -1;
        } else if (appointment_a_start.isAfter(appointment_b_start)) {
            return 1;
        } else {
            return 0;
        }
    }

    update_appointment = async (appointment_id: string, data: Appointment) => {
        return this.repo.update(
            appointment_id,
            data
        ).then(() => this.#sanitise_appointment(appointment_id));
    }
}