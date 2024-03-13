import CONSTANTS from "../../constants";

import { NextFunction, Request, Response } from "express";
import { Unauthorized } from '../errors';
import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';

const { open_routes } = require('../config');

const is_protected_route = (request: Request) => {
    const request_route = request.path.replace(/^\/|\/$/g, '')?.split('/')?.[0];

    if (
        (request_route && open_routes.includes(request_route)) ||
        process.env.ENVIRONMENT === 'development' ||
        process.env.ENVIRONMENT === 'staging'
    ) {
        return false;
    } else return true;
}

const app_check_handler = async (request: Request, response: Response, next: NextFunction) => {
    const app_check_token = request.get(CONSTANTS.SETTINGS.NETWORK.HEADERS.APP_CHECK_TOKEN) as string | undefined;

    if (!is_protected_route(request)) {
        return next();
    }
    
    if (app_check_token) {
        try {
            await admin.appCheck().verifyToken(
                app_check_token
            );
            return next();
        } catch (error) {
            Sentry.captureException(error);
        }
    }

    throw new Unauthorized('Invalid app check token');
};

export default app_check_handler;