import CONSTANTS from "../../constants";

import * as status from 'http-status';
import BaseError from './_BaseError';

export default class Throttled extends BaseError {
    constructor(message: string) {
        super(CONSTANTS.ERRORS.TYPES.THROTTLED, status.TOO_MANY_REQUESTS, message || status['429_MESSAGE']);
    }
}