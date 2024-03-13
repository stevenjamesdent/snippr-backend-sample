import Controller from "./controller";
import express from 'express';

const router = express.Router();
const controller = new Controller();

// ---------------------------------------------------------------------------------------

router.get('/:latitude/:longitude', (request, response) => {
    response.promise(() => controller.is_covered(request));
});

// ---------------------------------------------------------------------------------------

export default router;