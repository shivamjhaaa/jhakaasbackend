import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Course } from "../models/Course.js";
import { Stats } from "../models/Stats.js";
import getDataUri from "../utils/dataURI.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from 'cloudinary';

export const getAllCourses = catchAsyncError(async (req, res, next) => {

    const keyword = req.query.keyword || '';
    const category = req.query.category || '';


    const courses = await Course.find({
        title:{
            $regex: keyword,
            $options: 'i',
        },
        category:{
            $regex: category,
            $options: 'i',
        },
    }).select('-lectures'); //so that without subscription people cant access lectures
    res.status(200).send({
        success: true,
        courses,
    });
});

export const createCourse = catchAsyncError(async (req, res, next) => {

    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy)
        return next(new ErrorHandler('Please add all Fields', 400));

    const file = req.file;

    const fileURI = getDataUri(file);

    const myCloud = await cloudinary.v2.uploader.upload(fileURI.content);

    await Course.create({
        title, description, category, createdBy,
        poster: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    });

    res.status(201).send({
        success: true,
        message: 'Course Created Succesfully. You can add Lectures now'
    });
});


export const getCourseLectures = catchAsyncError(async (req, res, next) => {

    const course = await Course.findById(req.params.id);

    if (!course) return next(new ErrorHandler('Course Not Found', 404));

    course.views += 1;

    await course.save();

    res.status(200).send({
        success: true,
        lectures: course.lectures,
    });
});


//MAX VIDEO SIZE - 100mb
export const addLectures = catchAsyncError(async (req, res, next) => {

    const { title, description } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return next(new ErrorHandler('Course Not Found', 404));


    //upload file here

    const file = req.file;
    const fileURI = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileURI.content, {
        resource_type: 'video',
    });


    course.lectures.push({
        title, description,
        video: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    });

    course.numOfVideos = course.lectures.length;

    await course.save();

    res.status(200).send({
        success: true,
        message: 'Lecture Added!',
    });
});


export const deleteCourse = catchAsyncError(async (req, res, next) => {

    const course = await Course.findById(req.params.id);

    if (!course) return next(new ErrorHandler('Course Not Found', 404));

    await cloudinary.v2.uploader.destroy(course.poster.public_id);

    for (let i = 0; i < course.lectures.length; i++) {
        await cloudinary.v2.uploader.destroy(course.lectures[i].video.public_id, {
            resource_type: 'video',
        });
    }

    await course.deleteOne();

    res.status(200).send({
        success: true,
        message: 'Course Deleted!',
    });
});


export const deleteLecture = catchAsyncError(async (req, res, next) => {

    const {courseId , lectureId} = req.query;
    const course = await Course.findById(courseId);
    if (!course) return next(new ErrorHandler('Course Not Found', 404));

    const delete_lecture = course.lectures.find((item)=>{
        if (item._id.toString() === lectureId.toString()) return item;
    })
    
    await cloudinary.v2.uploader.destroy(delete_lecture.video.public_id, {
        resource_type: 'video',
    });

    course.lectures = course.lectures.filter((item) => {
        if (item._id.toString() !== lectureId.toString()) return item;
    });

    course.numOfVideos = course.lectures.length;
    await course.save();

    res.status(200).send({
        success: true,
        message: 'Lecture Deleted!',
    });
});


Course.watch().on('change',async ()=>{
    const stats = await Stats.find({}).sort({createdAt:'desc'}).limit(1);

    const courses = await Course.find({});

    let totalViews = 0;

    for(let i = 0; i<courses.length; i++){
        totalViews += courses[i].views;
    };

    stats[0].views = totalViews;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();

})