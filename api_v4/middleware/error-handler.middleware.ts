import CONSTANTS from "../../constants";

import { create_error_response } from "../utils/response.util";
import { NextFunction, Request, Response } from "express";
import * as status from 'http-status';
import BaseError from '../errors/_BaseError';

type HandledError = BaseError | Error;

const error_handler = (error: HandledError, request: Request, response: Response, next: NextFunction) => {
    if (error instanceof BaseError) {
        return response
            .status(error.statusCode)
            .json(create_error_response(error.statusCode, error.type, undefined, error.message));
    }

    return response
        .status(status.INTERNAL_SERVER_ERROR)
        .json(create_error_response(status.INTERNAL_SERVER_ERROR, CONSTANTS.ERRORS.TYPES.SERVER, undefined, error.message));
};

export default error_handler;