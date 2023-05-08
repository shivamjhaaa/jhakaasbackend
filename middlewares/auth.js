import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncError } from "./catchAsyncError.js";
import jwt from "jsonwebtoken";


export const isAuthenticated = catchAsyncError(async (req,res,next)=>{
    const {token} = req.cookies;

    if(!token) return next(new ErrorHandler("Not Logged In",401));

    const decoded_token = jwt.verify(token,process.env.JWT_SECRET);

    req.user = await User.findById(decoded_token._id);

    next(); 
});


export const authorizeAdmin = (req,res,next)=>{
    
    if(req.user.role !== 'admin') 
        return next(new ErrorHandler(`Access Denied for ${req.user.role}`,403));
    
    next();
    
};

export const authorizeSubscribers = (req,res,next)=>{
    
    if(req.user.subscription.status !== 'active' && req.user.role!=='admin') 
        return next(new ErrorHandler(`Only Subscribers can access this resource`,403));
    
    next();
    
};