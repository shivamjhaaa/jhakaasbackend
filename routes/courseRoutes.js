import express from "express";
import { addLectures, createCourse, deleteCourse, deleteLecture, getAllCourses, getCourseLectures } from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import { authorizeAdmin, authorizeSubscribers, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

//get all courses without lectures
router.route('/courses').get(getAllCourses);

//to create new course - only admin
router.route('/createcourse').post(isAuthenticated , authorizeAdmin ,singleUpload, createCourse);

//add lectures , delete course , get course details
router.route("/course/:id")
    .get(isAuthenticated ,authorizeSubscribers, getCourseLectures)
    .post(isAuthenticated ,authorizeAdmin , singleUpload,addLectures)
    .delete(isAuthenticated,authorizeAdmin,singleUpload,deleteCourse);



//delete lecture
router.route("/lecture")
    .delete(isAuthenticated,authorizeAdmin,singleUpload,deleteLecture);

export default router;