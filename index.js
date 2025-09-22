const express = require("express");
const app = express();
//const methodOverride = require("method-override");
//const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
// const { listingSchema } = require("./schema.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
require("dotenv").config();

const path = require("path");
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(methodOverride("_method"));
// app.engine("ejs", ejsMate);

const userRouter = require("./routes/user.js");


const mongoose = require("mongoose");

main()
  .then(() => {
    console.log("connected");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/internNode");
}


app.get("/", (req, res) => {
  res.send("HII, it's working!");
});

const sessionOptions = {
  secret: process.env.SESSION_SECRET, // read from .env
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000*60*60*24, // 1 day
    maxAge: 1000*60*60*24
  }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize()); //middleware that is initialzing passport.
app.use(passport.session());//tracking web app to browse from page to page(for the same user)
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});


// app.get("/demouser", async(req,res)=>{
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student"
//     });

//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });

app.use("/", userRouter);

// app.all(/.*/ , (req,res,next) =>{
//   next(new ExpressError(404, "Page not found!"));
// });





app.use((err,req,res,next) =>{
  let { status = 500, message = "Something went wrong!" } = err;
  res.status(status).render("error.ejs", {message}); 
})

app.get("/home", (req,res)=>{
    res.render("home.ejs");
})

app.listen(5050, ()=>{
    console.log("Server running at port 5050");
})