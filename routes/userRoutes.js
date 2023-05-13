import express from "express";
import { addToPlaylist, changePassword, deleteProfile, deleteUser, forgetPasswrod, getAllUsers, getMyProfile, login, logout, register, removeFromPlaylist, resetPassword, updateProfile, updateProfilePicture, updateUserRole } from "../controllers/UserController.js";
import { authorizeAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

//to register
router.route('/register').post(singleUpload, register);

//to login

router.route('/login').post(login);


//to logout
router.route('/logout').get(logout);

//get my profile 
router.route('/profile')
    .get(isAuthenticated, getMyProfile)
    .delete(isAuthenticated, deleteProfile);


//change Password
router.route('/changepassword').put(isAuthenticated, changePassword);

//UpdateProfile
router.route('/updateprofile').put(isAuthenticated, updateProfile);

//Update Profile PIcture
router.route('/updateprofilepicture').put(isAuthenticated, singleUpload, updateProfilePicture);

//forget password
router.route('/forgetpassword').post(forgetPasswrod);

//reset password
router.route('/resetpassword/:token').post(resetPassword);

//add To Playlist
router.route('/addtoplaylist').post(isAuthenticated, addToPlaylist);

//remove from playlist
router.route('/removefromplaylist').delete(isAuthenticated, removeFromPlaylist);

//Admin Routes
router.route('/admin/users').get(isAuthenticated, authorizeAdmin, getAllUsers);

router.route('/admin/user/:id')
    .put(isAuthenticated, authorizeAdmin, updateUserRole)
    .delete(isAuthenticated, authorizeAdmin, deleteUser)

export default router;