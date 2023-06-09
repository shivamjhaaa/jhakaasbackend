import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import ErrorMiddleware from "./middlewares/Error.js";
import cors from 'cors';


config({
    path:'./config/config.env'
})
const app = express();

//Using Middlewares

app.use(express.json());
app.use(express.urlencoded({
    extended: true,
}));
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET','POST','PUT','DELETE'],
}));    

//Importing and Using Routes
import course from './routes/courseRoutes.js';
import user from './routes/userRoutes.js';
import payment from './routes/paymentRoutes.js';
import other from './routes/otherRoutes.js';

app.use('/api/v1',course);
app.use('/api/v1',user);
app.use('/api/v1',payment);
app.use('/api/v1',other);

app.get('/',(req,res)=>{
    res.send(`<h1>Server is Working Fine. Visit <a href='${process.env.FRONTEND_URL}'>Jhakaas</a>`);
});

export default app;

app.use(ErrorMiddleware); 
//To call error (always on last)
// whenever we will be calling next(new ErrorHandler(message)) it will understand that we are talking about this middleware and this will be called because its first parameter is errror

