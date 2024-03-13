import CONSTANTS from "../../constants";

import * as status from 'http-status';
import BaseError from './_BaseError';

export default class Unauthorized extends BaseError {
    constructor(message: string) {
        super(CONSTANTS.ERRORS.TYPES.NOT_AUTHENTICATED, status.UNAUTHORIZED, message || status['401_MESSAGE']);
    }
}