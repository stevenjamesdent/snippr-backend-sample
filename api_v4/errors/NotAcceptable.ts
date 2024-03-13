import CONSTANTS from "../../constants";

import * as status from 'http-status';
import BaseError from './_BaseError';

export default class NotAcceptable extends BaseError {
    constructor(message: string) {
        super(CONSTANTS.ERRORS.TYPES.NOT_ACCEPTABLE, status.NOT_ACCEPTABLE, message || status['406_MESSAGE']);
    }
}