import express from "express";
import { authorizeAdmin, isAuthenticated } from "../middlewares/auth.js";
import { contact, courseRequest, getDashboardStats } from "../controllers/otherControllers.js";

const router = express.Router();


// contact form 
router.route('/contact').post(contact);

// Request Course
router.route('/courserequest').post(courseRequest);

//adin stats
router.route('/admin/stats').get(isAuthenticated,authorizeAdmin,getDashboardStats)


export default router;