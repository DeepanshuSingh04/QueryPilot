import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";


/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 * @body { username, email, password }
 */
export async function register(req, res) {

    const { username, email, password } = req.body;

    const isUserAlreadyRegistered = await userModel.findOne({ 
        $or: [{ email }, { username }]
     });

    if(isUserAlreadyRegistered) {
        return res.status(400).json({ 
            message: "User already registered with this email or username",
            success: false,
            err: "User already exists"
        });
    }

    //agr user nhi hain phle se to create krdenge

    const user = await userModel.create({ username, email, password });

    const emailVerificationToken = jwt.sign({
        email: user.email,
    }, process.env.JWT_SECRET)


    await sendEmail({
        to: email,
        subject: "Welcome to QueryPilot!",
        html: `
                <p>Hi ${username},</p>
                <p>Thank you for registering at <strong>QueryPilot</strong>. We're excited to have you on board!</p>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="${process.env.SERVER_URL}/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
                <p>If you did not create an account, please ignore this email.</p>
                <p>Best regards,<br>The QueryPilot Team</p>
        `
    })

    res.status(201).json({
        message: "User registered successfully",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });

}


/**
 * @desc Login user and return JWT token
 * @route POST /api/auth/login
 * @access Public
 * @body { email, password }
 */
export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "User not found"
        })
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "Incorrect password"
        })
    }

    if (!user.verified) {
        return res.status(400).json({
            message: "Please verify your email before logging in",
            success: false,
            err: "Email not verified"
        })
    }

    const token = jwt.sign({    // agr user vierifies hua to hi token create hoga 
        id: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 din
    })

    res.status(200).json({
        message: "Login successful",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @desc Get current logged in user's details
 * @route GET /api/auth/get-me
 * @access Private
 */
export async function getMe(req, res) {
    const userId = req.user.id;

    const user = await userModel.findById(userId).select("-password");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false,
            err: "User not found"
        })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        success: true,
        user
    })
}


/**
 * @desc Verify user's email address
 * @route GET /api/auth/verify-email
 * @access Public
 * @query { token }
 */
export async function verifyEmail(req, res) {
    const {token} = req.query; // req.query Express mein URL ke query parameters ko access karne ke liye use hota hai

    try{

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findOne({ email: decoded.email });

    if (!user) {
            return res.status(400).json({
                message: "Invalid token",
                success: false,
                err: "User not found"
            })
        }

        user.verified = true;

        await user.save();

        const html =
            `
        <h1>Email Verified Successfully!</h1>
        <p>Your email has been verified. You can now log in to your account.</p>
        <a href="${process.env.CLIENT_URL}/login">Go to Login</a>
    `

    return res.send(html);

    } catch(err){
        return res.status(400).json({
            message: "Invalid or expired token",
            success: false,
            err: err.message
        })
    }
    
}