import Controller from "./controller";
import express from 'express';

const router = express.Router();
const controller = new Controller();

// ---------------------------------------------------------------------------------------

router.get('/:user_id', (request, response) => {
    response.promise(() => controller.get_user_alerts(request));
});


router.put('/viewed', (request, response) => {
    response.promise(() => controller.mark_alerts_viewed(request));
});


router.put('/actioned/:alert_id', (request, response) => {
    response.promise(() => controller.mark_alert_actioned(request));
});

// ---------------------------------------------------------------------------------------

export default router;