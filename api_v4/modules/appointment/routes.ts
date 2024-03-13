import Controller from "./controller";
import express from 'express';

const router = express.Router();
const controller = new Controller();

// ---------------------------------------------------------------------------------------

router.get('/:user_id/:start_date?/:end_date?', (request, response) => {
    response.promise(() => controller.get_appointments(request));
});


router.post('/:user_id', (request, response) => {
    response.promise(() => controller.create_appointment(request));
});


router.put('/:appointment_id', (request, response) => {
    response.promise(() => controller.update_appointment(request));
});


router.delete('/:appointment_id', (request, response) => {
    response.promise(() => controller.cancel_appointment(request));
});

// ---------------------------------------------------------------------------------------

export default router;