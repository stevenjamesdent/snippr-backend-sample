import CONSTANTS from "../../constants";

import { DateRange, extendMoment } from 'moment-range';
import { Timestamp } from '../../types/types.firebase';
import * as Moment from 'moment-timezone';

const moment = extendMoment(Moment);

export default class MomentHelper {
    date_format: string;
    datetime_format: string;
    time_format: string;
    time_zone: string;
    
    constructor() {
        this.date_format = CONSTANTS.SETTINGS.MOMENT.FORMATS.DATE.UTIL;
        this.datetime_format = CONSTANTS.SETTINGS.MOMENT.FORMATS.DATE_TIME.UTIL;
        this.time_format = CONSTANTS.SETTINGS.MOMENT.FORMATS.TIME.UTIL;
        this.time_zone = CONSTANTS.SETTINGS.MOMENT.TIME_ZONE;
    }

    date_as_moment = (date_string: string) => {
        return moment.tz(
            date_string,
            this.date_format,
            this.time_zone
        ).startOf('day');
    }

    duration = (value: number, unit: Moment.unitOfTime.DurationConstructor) => {
        return moment.duration(
            value,
            unit
        );
    }

    date_to_day = (date: string) => {
        return this.date_as_moment(date)
                    .format(CONSTANTS.SETTINGS.MOMENT.FORMATS.DAY)
                    .toLowerCase();
    }

    datetime_as_moment = (datetime: string) => {
        return moment.tz(
            datetime,
            this.datetime_format,
            this.time_zone
        );
    }

    timestamp_to_moment = (timestamp: Date | Timestamp) => {
        return timestamp instanceof Date ? moment.tz(
            timestamp,
            this.time_zone
        ) : moment.tz(
            moment.unix(timestamp._seconds),
            this.time_zone
        );
    }

    get_greater_duration = (duration_a: Moment.Duration, duration_b: Moment.Duration) => {
        if (!duration_a || !duration_b) return duration_a || duration_b;

        if (duration_a.clone().asSeconds() >= duration_b.clone().asSeconds()) {
            return duration_a;
        } else {
            return duration_b;
        }
    }

    get_lesser_duration = (duration_a: Moment.Duration, duration_b: Moment.Duration) => {
        if (!duration_a || !duration_b) return duration_a || duration_b;

        if (duration_a.clone().asSeconds() <= duration_b.clone().asSeconds()) {
            return duration_a;
        } else {
            return duration_b;
        }
    }
    
    get_range = (moment_a: Moment.Moment, moment_b: Moment.Moment) => {
        return moment.range(
            moment_a,
            moment_b
        );
    }

    moment_as_date_string = (moment: Moment.Moment) => {
        return moment.format(
            this.date_format
        );
    }

    now = () => {
        return moment.tz(
            this.time_zone
        );
    }

    range_to_duration = (moment_range: DateRange) => {
        return moment.duration(
            moment_range.diff('seconds'),
            'second'
        );
    }

    time_as_moment = (time: string) => {
        return moment.tz(
            time,
            this.time_format,
            this.time_zone
        );
    }

    ttl = (ttl_constant: { value: number, unit: Moment.unitOfTime.DurationConstructor | string }) => {
        return this.duration(
            ttl_constant.value,
            ttl_constant.unit as Moment.unitOfTime.DurationConstructor
        );
    }
}