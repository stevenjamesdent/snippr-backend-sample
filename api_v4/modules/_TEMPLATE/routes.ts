import Controller from "./controller";
import express from 'express';

const router = express.Router();
const controller = new Controller();

// ---------------------------------------------------------------------------------------

// router.post('', (request, response) => {
//     response.promise(() => controller.foobar(request));
// });

// ---------------------------------------------------------------------------------------

export default router;