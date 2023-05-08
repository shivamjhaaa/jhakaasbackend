import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { Stats } from "../models/Stats.js";

export const contact = catchAsyncError(async (req, res, next) => {

    const { name, email, message } = req.body;

    if (!name || !email || !message) return next(new ErrorHandler('All Fields are required', 400));

    const email_to = process.env.MY_MAIL;
    const subject = "Contact From Jhakaas";
    const text = `Name: ${name} \nEmail: ${email}\n${message}`;

    await sendEmail(email_to, subject, text);

    res.status(200).json({
        success: true,
        message: 'Your Message has been sent!'
    })
});

export const courseRequest = catchAsyncError(async (req, res, next) => {

    const { name, email, course } = req.body;

    const email_to = process.env.MY_MAIL;
    const subject = "Course Request From Jhakaas";
    const text = `Name: ${name} \nEmail: ${email}\n${course}`;

    await sendEmail(email_to, subject, text);

    res.status(200).json({
        success: true,
        message: 'Your Request has been sent!'
    })
});

export const getDashboardStats = catchAsyncError(async (req, res, next) => {

    const stats = await Stats.find({}).sort({ createdAt: 'desc' }).limit(12);

    const statsData = [];

    for (let i = 0; i < stats.length; i++) {
        statsData.unshift(stats[i]);
    }

    for (let i = 0; i < 12 - stats.length; i++) {
        statsData.unshift({
            users: 0,
            subscriptions: 0,
            views: 0
        });
    }

    const usersCount = statsData[11].users;
    const subscribersCount = statsData[11].subscriptions;
    const viewsCount = statsData[11].views;

    let usersChangePercentage = 0;
    let subscribersChangePercentage = 0;
    let viewsChangePercentage = 0;

    let usersGain = true;
    let subscribersGain = true;
    let viewsGain = true;

    if (statsData[10].users === 0) usersChangePercentage = usersCount * 100;
    if (statsData[10].subscriptions === 0) subscribersChangePercentage = subscribersCount * 100;
    if (statsData[10].views === 0) viewsChangePercentage = viewsCount * 100;

    else {
        const difference = {
            users: statsData[11].users - statsData[10].users,
            subscribers: statsData[11].subscriptions - statsData[10].subscriptions,
            views: statsData[11].views - statsData[10].views,
        }

        usersChangePercentage = (difference.users / statsData[10].users) * 100;
        subscribersChangePercentage = (difference.subscribers / statsData[10].subscriptions) * 100;
        viewsChangePercentage = (difference.views / statsData[10].views) * 100;

        if (usersChangePercentage < 0) usersGain = false;
        if (subscribersChangePercentage < 0) subscribersGain = false;
        if (viewsChangePercentage < 0) viewsGain = false;

    }

    res.status(200).json({
        success: true,
        stats: statsData,
        usersCount,
        subscribersCount,
        viewsCount,
        usersChangePercentage,
        subscribersChangePercentage,
        viewsChangePercentage,
        usersGain,
        subscribersGain,
        viewsGain,

    });

});