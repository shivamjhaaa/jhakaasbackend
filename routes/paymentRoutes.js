import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { buySubscription, cancelSubscription, getRazorpayKey, paymentVerification } from "../controllers/paymentController.js";

const router = express.Router();


//Buy Subscription

router.route('/subscribe').get(isAuthenticated,buySubscription);

//vERIFY payment and save reference in db
router.route('/paymentverification').post(isAuthenticated,paymentVerification);

//get razorpay key
router.route('/razorpaykey').get(getRazorpayKey);

//cancel subscription
router.route('/subscribe/cancel').delete(isAuthenticated,cancelSubscription);

export default router;