import CONSTANTS from "../../constants";

import * as status from 'http-status';
import BaseError from './_BaseError';

export default class BadRequest extends BaseError {
    constructor(message: string) {
        super(CONSTANTS.ERRORS.TYPES.VALIDATION, status.BAD_REQUEST, message || status['400_MESSAGE']);
    }
}