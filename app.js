import express from "express";
import db from "./db/db.js"; //import database connection pool
import dotenv from "dotenv"; //import dotenv to load env variables
import cors from "cors"; //import cors
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import requireAuth from "./middleware/requireAuth.js";

dotenv.config(); //load from .env file

//import controllers
import reviewController from "./controllers/reviewController.js";

import {
  learnersController,
  addLearnerController,
} from "./controllers/learnersController.js";

import {
  collectionsController,
  addCollectionController,
} from "./controllers/collectionsController.js";

import {
  studyItemsController,
  addStudyItemController,
  dueStudyItemsController,
} from "./controllers/studyItemsController.js";

import {
  signUpController,
  loginController,
  checkCurrentUserController,
  logoutController,
} from "./controllers/authController.js";

import progressSummaryController from "./controllers/progressController.js";

const PgSession = connectPgSimple(session); //session store using postgres

//config express app
const app = express();

//session middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
); //enable cors

app.use(express.json());

app.use(
  session({
    store: new PgSession({
      pool: db, //use existing db connection pool
      tableName: "session", //table to store sessions
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false, //only save if something changes
    saveUninitialized: false, //don't save empty sessions
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", //fine for localhost,do not leave hardcoded should be env dependent
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", //lax for dev, none for production with secure cookies
      maxAge: 1000 * 60 * 60 * 24, //1 day
    },
  }),
);

//controller for querying users
//should import from other files later cuz separation of concerns

//collection controllers

//study

//review/scheduling logic stuff

//route for controller
app.get("/api/learners", learnersController);
app.post("/api/learners", addLearnerController); //addlearner redundant because of auth routes?

app.get("/api/collections/", requireAuth, collectionsController);
app.post("/api/collections", requireAuth, addCollectionController);

app.get("/api/study-items/due", requireAuth, dueStudyItemsController);
app.get("/api/study-items/:collectionId", requireAuth, studyItemsController);
app.post("/api/study-items", requireAuth, addStudyItemController);
app.post("/api/review", requireAuth, reviewController);

app.post("/api/auth/signup", signUpController);
app.post("/api/auth/login", loginController);
app.get("/api/auth/check", checkCurrentUserController);
app.post("/api/auth/logout", logoutController);

app.get("/api/progress/summary", requireAuth, progressSummaryController);

//start server
const PORT = process.env.PORT || 5000; //if not set, use 5000 otherwise set manually
app.listen(PORT, () => console.log("Server started on port " + PORT));
