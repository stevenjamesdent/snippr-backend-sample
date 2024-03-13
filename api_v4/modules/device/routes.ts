import Controller from "./controller";
import express from 'express';

const router = express.Router();
const controller = new Controller();

// ---------------------------------------------------------------------------------------

router.post('/:token/:user_id', (request, response) => {
    response.promise(() => controller.create(request));
});

// ---------------------------------------------------------------------------------------

export default router;