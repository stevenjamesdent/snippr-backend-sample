import * as admin from 'firebase-admin';
import { storageBucket } from "firebase-functions/params";

const storage_bucket = storageBucket.value();

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: storage_bucket
});

import { app_check_handler, error_handler, not_found_handler, response_handler } from './middleware';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import api_routes from './routes';
import cors from 'cors';
import express from 'express';
import helmet from "helmet";

const app = express();

Sentry.init({
    dsn: "",
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
    environment: process.env.ENVIRONMENT,
});

app.use(cors({ origin: true }));
app.use(helmet());
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(app_check_handler);
app.use(response_handler);
app.use(error_handler);
app.use(Sentry.Handlers.errorHandler());

app.use('', api_routes);

app.use(not_found_handler);

export default app;