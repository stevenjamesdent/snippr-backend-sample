import CONSTANTS from "../../../constants";

import Repo from "./repo";
import SnipprID from "../../utils/snipprid.util";
import { Area } from "../../../types/types.area";
import { Booking } from "../../../types/types.booking";
import GeoService from "../../services/geo.service";

export default class Service {
    repo: Repo;
    snippr_id: SnipprID;
    geo_service: GeoService;

    constructor() {
        this.repo = new Repo();
        this.snippr_id = new SnipprID(CONSTANTS.SETTINGS.UUIDS.AREA);
        this.geo_service = new GeoService();
    }

    #id = (user_id: string) : string => {
        return this.snippr_id.generate_id(user_id);
    }

    check_for_conflicts = async (area_data: Area, bookings: Booking[]) => {
        const conflicted_bookings = bookings.filter((booking) => {
            const [booking_latitude, booking_longitude] = booking[CONSTANTS.FIELDS.BOOKINGS.LOCATION];
            const distance = this.geo_service.get_distance_between(
                booking_latitude,
                booking_longitude,
                area_data[CONSTANTS.FIELDS.AREAS.CENTER_LATITUDE],
                area_data[CONSTANTS.FIELDS.AREAS.CENTER_LONGITUDE]
            );

            if (distance > this.miles_to_meters(area_data[CONSTANTS.FIELDS.AREAS.RADIUS_MILES])) {
                return true;
            } else {
                return false;
            }
        });

        return conflicted_bookings?.length 
                    ? conflicted_bookings.map((booking) => booking[CONSTANTS.FIELDS.BOOKINGS.SNIP_ID])
                    : false;
    }

    get_area = (user_id: string) => {
        return this.repo.get(
            this.#id(user_id)
        );
    }

    get_areas_within_maximum_radius_of_location = (latitude: number, longitude: number) => {
        const maximum_area_radius_meters = this.miles_to_meters(CONSTANTS.SETTINGS.AREAS.MAX_RADIUS_MILES);
        const maximum_area_bounds = this.geo_service.get_geohash_query_bounds(
            latitude,
            longitude,
            maximum_area_radius_meters
        );

        return this.repo.get_local_areas(maximum_area_bounds);
    }

    get_users_by_location_coverage = async (latitude: number, longitude: number) => {
        let users_covering_location = [] as any;
        const areas_within_maximum_radius = await this.get_areas_within_maximum_radius_of_location(
            latitude,
            longitude
        ) as [Area];
        
        return Promise.all(areas_within_maximum_radius.map((area: Area) => {
            const area_radius_meters = area[CONSTANTS.FIELDS.AREAS.RADIUS_METERS];
            const actual_distance_meters = this.geo_service.get_distance_between(
                latitude,
                longitude,
                area[CONSTANTS.FIELDS.AREAS.CENTER_LATITUDE],
                area[CONSTANTS.FIELDS.AREAS.CENTER_LONGITUDE]
            );

            if (actual_distance_meters <= area_radius_meters) {
                users_covering_location.push(area[CONSTANTS.FIELDS.AREAS.USER_ID]);
            }
        })).then(() => {
            return users_covering_location;
        });
    }

    is_covered = async (latitude: number, longitude: number) => {
        const users_covering_location = await this.get_users_by_location_coverage(
            latitude,
            longitude
        );

        return users_covering_location?.length > 0 ? true : false;
    }

    miles_to_meters = (miles: any) => {
        return parseInt(miles) * 1609.344;
    }
    
    set_area = async (user_id: string, area_data: Area) => {
        const geohash = this.geo_service.get_geohash(
            area_data[CONSTANTS.FIELDS.AREAS.CENTER_LATITUDE],
            area_data[CONSTANTS.FIELDS.AREAS.CENTER_LONGITUDE]
        );

        return this.repo.create(
            this.#id(user_id),
            {
                ...area_data,
                [CONSTANTS.FIELDS.AREAS.GEOHASH]: geohash,
                [CONSTANTS.FIELDS.AREAS.RADIUS_METERS]: this.miles_to_meters(area_data[CONSTANTS.FIELDS.AREAS.RADIUS_MILES]),
                [CONSTANTS.FIELDS.AREAS.USER_ID]: user_id,
            }
        ).then(() => {
            return this.get_area(
                user_id
            );
        });
    }
}