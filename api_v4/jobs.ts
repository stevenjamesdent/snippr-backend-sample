import * as functions from 'firebase-functions';
import Controller from "./modules/jobs/controller";

const jobs = new Controller();
const timezone = 'Europe/London';

const jobCompleteSnips = functions.pubsub.schedule('every hour').timeZone(timezone).onRun((context) => {
    return jobs.complete_fulfilled_snips();
});

export default {
    jobCompleteSnips,
};