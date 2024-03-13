import CONSTANTS from "../../constants";

import * as status from 'http-status';
import BaseError from './_BaseError';

export default class Forbidden extends BaseError {
    constructor(message: string) {
        super(CONSTANTS.ERRORS.TYPES.PERMISSION_DENIED, status.FORBIDDEN, message || status['403_MESSAGE']);
    }
}