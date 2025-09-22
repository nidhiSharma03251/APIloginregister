const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const crypto = require("crypto");      
const nodemailer = require("nodemailer");


router.get("/signup", (req,res) =>{
    res.render("signup");
})

router.post("/signup", wrapAsync( async(req,res) =>{
    try{
        let {username,email,password } = req.body;
    const newUser = new User({email,username}); 
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.flash("success", "User was registered");
    res.redirect("/home");
    }catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}))

router.get("/login", (req,res) =>{
    res.render("login");
})

router.post("/login", passport.authenticate("local", { failureRedirect: '/login', failureFlash:true}), async(req,res)=>{
    req.flash("success","WELCOME! You are logged in");
        res.redirect("/home");
});

router.get("/logout", (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully!");
        res.redirect("/home");
    });
});

router.get("/forgotPass", (req,res) =>{
    res.render("forgot");
})

router.post("/forgotPass", wrapAsync(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        req.flash("error", "No account with that email.");
        return res.redirect("/forgotPass");
    }
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Password Reset",
        text: `Click to reset: http://${req.headers.host}/reset/${token}`
    };

    await transporter.sendMail(mailOptions);
    req.flash("success", "Password reset link sent!");
    res.redirect("/login");
}))


router.get("/reset/:token", wrapAsync(async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash("error", "Token invalid or expired.");
        return res.redirect("/forgotPass");
    }
    res.render("reset", { token: req.params.token });
}));

router.post("/reset/:token", wrapAsync(async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        req.flash("error", "Token invalid or expired.");
        return res.redirect("/forgotPass");
    }

    user.setPassword(req.body.password, async function(err) {
    if (err) {
        req.flash("error", "Error resetting password.");
        return res.redirect("/forgotPass");
    }
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save(); 
    req.login(user, function(err) {
        if (err) {
            req.flash("success", "Password updated! Please log in.");
            return res.redirect("/login");
        }
        req.flash("success", "Password updated! You are now logged in.");
        res.redirect("/home");
    });
});

}));


module.exports = router;