import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js"
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from 'crypto';
import { Course } from "../models/Course.js";
import cloudinary from 'cloudinary'
import getDataUri from "../utils/dataURI.js";
import { Stats } from "../models/Stats.js";


export const register = catchAsyncError(async (req, res, next) => {

    const { name, email, password } = req.body;
    const file = req.file

    // console.log(name,email,password,file); //undefined undefined .. because not multetr in user route
    
    if (!name || !email || !password || !file)
    return next(new ErrorHandler('Please enter all Fields', 400));
    
    let user = await User.findOne({ email });
    
    if (user) return next(new ErrorHandler('User already Exists', 409));
    
    //upload file on cloudinary
    const fileURI = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileURI.content);

    user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    });

    sendToken(res, user, 'Registered Successfully', 201);

});

export const login = catchAsyncError(async (req, res, next) => {

    const { email, password } = req.body;

    // console.log(email , password)

    if (!email || !password)
        return next(new ErrorHandler('Please enter all Fields', 400));

    const user = await User.findOne({ email }).select('+password'); //because we have not accessed passwrod during creation of user model

    if (!user) return next(new ErrorHandler('Incorrect Email or Password', 401));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new ErrorHandler('Incorrect Email or Password', 401));


    sendToken(res, user, 'Login Successful', 200);

});

export const logout = catchAsyncError(async (req, res, next) => {

    //,ake sure to provide same options while destroying cookie that was used while creating
    res.status(200).cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        // secure: true,
        sameSite: 'none',
    }).json({
        success: true,
        message: 'Logged Out Succesfully',
    })
});


export const getMyProfile = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    res.status(200).json({
        success: true,
        user,
    });
});

export const changePassword = catchAsyncError(async (req, res, next) => {

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
        return next(new ErrorHandler('Please enter all Fields', 400));


    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch)
        return next(new ErrorHandler('Incorrect Old Password', 400));

    user.password = newPassword;

    await user.save();


    res.status(200).json({
        success: true,
        message: 'Password changed Successfully',
    });
});

export const updateProfile = catchAsyncError(async (req, res, next) => {

    const { name, email } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();


    res.status(200).json({
        success: true,
        message: 'Profile Updated Successfully',
    });
});




export const updateProfilePicture = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    //upload file on cloudinary
    const file = req.file
    const fileURI = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileURI.content);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
    };

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Profile Picture Updated Successfully',
    });
});





export const forgetPasswrod = catchAsyncError(async (req, res, next) => {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return next(new ErrorHandler('User Not Found', 400));

    const resetToken = await user.getResetToken();

    await user.save();

    // send token via mail 
    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    const message = `Click on the link to reset your password, ${url}`;

    await sendEmail(user.email, "Jhakaas Reset Password", message)

    res.status(200).json({
        success: true,
        message: `Reset Token Has been sent Successfully to ${user.email}`,
    });
});




export const resetPassword = catchAsyncError(async (req, res, next) => {

    const { token } = req.params;

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now(),
        }
    });

    if (!user) return next(new ErrorHandler('Token is Invalid or Expired', 401));

    user.password = req.body.password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;

    await user.save();


    res.status(200).json({
        success: true,
        message: 'Password Changed Successfully',
    });
});


export const addToPlaylist = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.body.id);

    if (!course) return next(new ErrorHandler('Invalid Course Id', 400));

    const courseExists = user.playlist.find((item)=>{
        if(item.course.toString() === course._id.toString()) return true;
    });
    if(courseExists) return next(new ErrorHandler('Course Already Exists in Playlist',400));

    user.playlist.push({
        course: course._id,
        poster: course.poster.url,
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Added to Playlist',
    });
});


export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.query.id);

    if (!course) return next(new ErrorHandler('Invalid Course Id', 400));
    

    const courseIndex = user.playlist.find((item,index)=>{
        if(item.course.toString() === course._id.toString()) return index;
    });

    user.playlist.splice(courseIndex,1);

    // const newPlaylist = user.playlist.filter((item)=>{
    //     if(item.course.toString() !== course._id.toString()) return item;
    // });

    // user.playlist = newPlaylist;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Removed from Playlist',
    });
});


export const getAllUsers = catchAsyncError(async (req, res, next) => {

    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    });
});

export const updateUserRole = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if (!user) return next(new ErrorHandler('User not Found', 404));

    if(user.role === 'user') user.role = 'admin';
    else user.role = 'user'


    await user.save();

    res.status(200).json({
        success: true,
        message: 'Role Updated'
    });
});


export const deleteUser = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if (!user) return next(new ErrorHandler('User not Found', 404));

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    //cancel Subscription

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: 'User Deleted Successfully'
    });
});

export const deleteProfile = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    if (!user) return next(new ErrorHandler('User not Found', 404));

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    //cancel Subscription

    await user.deleteOne();

    res.status(200).cookie('token',null,{
        expires: new Date(Date.now())
    }).json({
        success: true,
        message: 'User Deleted Successfully'
    });
});


User.watch().on('change',async ()=>{

    const stats = await Stats.find({}).sort({createdAt:'desc'}).limit(1);

    const subscriptions = await User.find({"subscription.status": "active"});

    stats[0].users = await User.countDocuments();
    stats[0].subscriptions = subscriptions.length;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
})

