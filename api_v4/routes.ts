import express from 'express';

import alerts from './modules/alert/routes';
import appointments from './modules/appointment/routes';
import areas from './modules/area/routes';
import availability from './modules/availability/routes';
import baskets from './modules/basket/routes';
import bookings from './modules/booking/routes';
import devices from './modules/device/routes';
import favourites from './modules/favourite/routes';
import invites from './modules/invite/routes';
import leave from './modules/leave/routes';
import locations from './modules/location/routes';
import recruits from './modules/recruit/routes';
import schedules from './modules/schedule/routes';
import snips from './modules/snip/routes';
import storefronts from './modules/storefront/routes';
import submissions from './modules/submission/routes';
import users from './modules/user/routes';
import web from './modules/web/routes';
import webhooks from './modules/webhook/routes';

const router = express.Router({ mergeParams: true });

router.use('/alerts', alerts)
router.use('/appointments', appointments)
router.use('/areas', areas)
router.use('/availability', availability)
router.use('/baskets', baskets)
router.use('/bookings', bookings)
router.use('/devices', devices)
router.use('/favourites', favourites)
router.use('/invites', invites)
router.use('/leave', leave)
router.use('/locations', locations)
router.use('/recruits', recruits)
router.use('/schedules', schedules)
router.use('/snips', snips)
router.use('/storefronts', storefronts)
router.use('/submissions', submissions)
router.use('/users', users)
router.use('/web', web)
router.use('/webhooks', webhooks)

export default router;