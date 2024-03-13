import CONSTANTS from "../../constants";

import * as status from 'http-status';
import BaseError from './_BaseError';

export default class UnsupportedMediaType extends BaseError {
    constructor(message: string) {
        super(CONSTANTS.ERRORS.TYPES.UNSUPPORTED_MEDIA_TYPE, status.UNSUPPORTED_MEDIA_TYPE, message || status['415_MESSAGE']);
    }
}