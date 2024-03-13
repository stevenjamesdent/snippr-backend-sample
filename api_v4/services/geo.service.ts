const CONSTANTS = require('@snippr/constants');

import geofire from 'geofire-common';
import { Client } from '@googlemaps/google-maps-services-js';

export default class GeoService {
    g_client: Client;

    constructor() {
        this.g_client = new Client({});
    }

    /**
     * Returns a geohash identifier for the given latitude/longitude pair.
     * @param {number} latitude_a - The latitude of location a
     * @param {number} longitude_a - The longitude of location a
     * @param {number} latitude_b - The latitude of location b
     * @param {number} longitude_b - The longitude of location b
     * @return {number} The distance in meters between location a and location b
     */
    get_distance_between = (latitude_a: number, longitude_a: number, latitude_b: number, longitude_b: number) => {
        const distance_kilometers = geofire.distanceBetween(
            [Number(latitude_a), Number(longitude_a)],
            [Number(latitude_b), Number(longitude_b)]
        );

        return distance_kilometers * 1000;
    }

    /**
     * Returns a geohash identifier for the given latitude/longitude pair.
     * @param {number} latitude - The latitude to be used for geohash generation
     * @param {number} longitude - The longitude to be used for geohash generation
     * @return {string} The geohash for the specified location.
     */
    get_geohash = (latitude: number, longitude: number) => {
        return geofire.geohashForLocation([Number(latitude), Number(longitude)]);
    }

    /**
     * Returns the query bounds for a given geohash
     * @param {number} center_latitude - The latitude to be used for center of the geohash query bounds
     * @param {number} center_longitude - The longitude to be used for center of the geohash query bounds
     * @param {number} radius_meters - The radius in meters of the geohash query bounds
     * @return {Array} An array of geohash query 'bounds'
     */
    get_geohash_query_bounds = (center_latitude: number, center_longitude: number, radius_meters: number) => {
        return geofire.geohashQueryBounds(
            [Number(center_latitude), Number(center_longitude)],
            Number(radius_meters)
        );
    }

    /**
     * Retrieves an object containing travel data (including 'TotalTime' and 'TotalDistance') as provided by the Loqate API.
     * @param {Object} origin_latlong - The Latitude and Longitude coordinates for the starting location, as an object {latitude: string, longitude: string}
     * @param {Object} destination_latlong  - The Latitude and Longitude coordinates for the finishing location, as an object {latitude: string, longitude: string}
     * @return {number} An integer representing the estimated travel time in seconds.
     */
    get_travel_time = async (origin_latlong: { latitude: number, longitude: number }, destination_latlong: { latitude: number, longitude: number }) => {
        return this.g_client.distancematrix({
            params: {
                key: process.env.GOOGLE_API_KEY!,
                origins: [{lat: origin_latlong.latitude, lng: origin_latlong.longitude}],
                destinations: [{lat: destination_latlong.latitude, lng: destination_latlong.longitude}]
            }
        }).then((response) => response.data.rows[0].elements[0].duration.value);
    }
}