import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import { instance } from "../server.js";
import ErrorHandler from "../utils/errorHandler.js";
import crypto from 'crypto';
import { Payment } from '../models/Payment.js'



export const buySubscription = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    if (user.role === 'admin') return next(new ErrorHandler('Admin cant buy subscription', 400));

    const plan_id = process.env.PLAN_ID || 'plan_Ln0ljgbDuMhw6i';

    const subscription = await instance.subscriptions.create({
        plan_id,
        customer_notify: 1,
        total_count: 12,
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(201).json({
        sucess: true,
        subscriptionId: subscription.id,
    })

});


export const paymentVerification = catchAsyncError(async (req, res, next) => {

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
    const user = await User.findById(req.user._id);

    const subscription_id = user.subscription.id;
    const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_API_SECRET)
        .update(razorpay_payment_id + '|' + subscription_id, 'utf-8')
        .digest('hex');

    const isAuthentic = generated_signature === razorpay_signature;

    if (!isAuthentic) return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);

    //if success store in db

    await Payment.create({
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature
    });

    user.subscription.status = "active";

    await user.save();


    res.redirect(`${proces.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`)

});


export const getRazorpayKey = catchAsyncError(async(req,res,next)=>{
    
    res.status(200).json({
        sucess: true,
        key: process.env.RAZORPAY_API_KEY
    });
});

export const cancelSubscription = catchAsyncError(async(req,res,next)=>{
    
    const user = await User.findById(req.user._id);
    const subscription_id = user.subscription.id;

    let refund = false;

    await instance.subscriptions.cancel(subscription_id);

    const payment = await Payment.findOne({
       razorpay_subscription_id: subscription_id, 
    });

    const gap = Date.now() - payment.createdAt;

    const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;

    if(refundTime > gap){
        await instance.payments.refund(payment.razorpay_payment_id);
        refund = true;
    }

    await payment.deleteOne();
    user.subscription.id = undefined;
    user.subscription.status = undefined;

    await user.save();

    res.status(200).json({
        sucess: true,
        message: refund ? 'Subscription Cancelled , You will recieve full refund within 7 days' : 'Subscription Cancelled , No Refund inintiated as Subscription was cancelled after 7 days',
    });
});