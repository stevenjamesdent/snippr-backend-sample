import CONSTANTS from "../../constants";

import * as status from 'http-status';
import BaseError from './_BaseError';

export default class NotFound extends BaseError {
    constructor(message: string) {
        super(CONSTANTS.ERRORS.TYPES.NOT_FOUND, status.NOT_FOUND, message || status['404_MESSAGE']);
    }
}