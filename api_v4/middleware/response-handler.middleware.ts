import CONSTANTS from "../../constants";

import { create_success_response } from "../utils/response.util";
import { NextFunction, Request, Response } from "express";
import * as status from 'http-status';

const response_handler = async (request: Request, response: Response, next: NextFunction) => {
    request.tenant = request.get(CONSTANTS.SETTINGS.NETWORK.HEADERS.TENANT) as string | undefined;
    request.client = {
        height: Number(request.get(CONSTANTS.SETTINGS.NETWORK.HEADERS.DEVICE_HEIGHT)),
        pixel_ratio: request.get(CONSTANTS.SETTINGS.NETWORK.HEADERS.DEVICE_PIXEL_RATIO),
        width: Number(request.get(CONSTANTS.SETTINGS.NETWORK.HEADERS.DEVICE_WIDTH)),
    };

    response.promise = (promise: any) => {
        let promise_to_resolve;

        if (promise.then && promise.catch) {
            promise_to_resolve = promise;
        } else if (typeof promise === 'function') {
            promise_to_resolve = Promise.resolve().then(() => promise());
        } else {
            promise_to_resolve = Promise.resolve(promise);
        }

        return promise_to_resolve.then(
            (data: Object) => response.status(status.OK).json(create_success_response(status.OK, data))
        );
    }

    return next();
}

export default response_handler;