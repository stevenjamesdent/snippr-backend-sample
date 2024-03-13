import CONSTANTS from "../../constants";

import { create_error_response } from "../utils/response.util";
import { Request, Response } from "express";
import * as status from 'http-status';

const not_found_handler = (request: Request, response: Response) => response.status(status.NOT_FOUND).json(
    create_error_response(status.NOT_FOUND, CONSTANTS.ERRORS.TYPES.NOT_FOUND, undefined, '404 - Not found')
);

export default not_found_handler;