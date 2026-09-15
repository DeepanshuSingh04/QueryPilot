import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";


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
        subject: "Welcome to Perplexity!",
        html: `
                <p>Hi ${username},</p>
                <p>Thank you for registering at <strong>Perplexity</strong>. We're excited to have you on board!</p>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
                <p>If you did not create an account, please ignore this email.</p>
                <p>Best regards,<br>The Perplexity Team</p>
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