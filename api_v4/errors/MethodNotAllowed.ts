import CONSTANTS from "../../constants";

import * as status from 'http-status';
import BaseError from './_BaseError';

export default class MethodNotAllowed extends BaseError {
    constructor(message: string) {
        super(CONSTANTS.ERRORS.TYPES.METHOD_NOT_ALLOWED, status.METHOD_NOT_ALLOWED, message || status['405_MESSAGE']);
    }
}