import db from "../db/db.js";
import bcrypt from "bcrypt";
import createDefaultCollection from "../seed/createDefaultCollection.js";

const signUpController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required",
      data: null,
    });
  }

  let message = "";
  let result = null;

  try {
    const checkSql = `
      SELECT id
      FROM learners
      WHERE email = $1;
    `;

    const existingLearner = await db.query(checkSql, [email]);

    if (existingLearner.rows.length > 0) {
      return res.status(400).json({
        message: "email already in use",
        data: null,
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO learners (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email;
    `;

    const queryResult = await db.query(insertSql, [email, password_hash]);

    result = queryResult.rows[0];

    // create default JLPT collection and starter set for new learner
    await createDefaultCollection(result.id);

    message = "Learner signed up successfully";
    return res.status(201).json({ message, data: result });
  } catch (error) {
    message = "Failed to sign up Learner: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

const loginController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required",
      data: null,
    });
  }

  let message = "";
  let result = null;

  try {
    const sql = `
      SELECT id, email, password_hash
      FROM learners
      WHERE email = $1;
    `;

    const queryResult = await db.query(sql, [email]);

    if (queryResult.rows.length === 0) {
      return res.status(400).json({
        message: "invalid email or password",
        data: null,
      });
    }

    const learner = queryResult.rows[0];

    const passwordMatch = await bcrypt.compare(password, learner.password_hash);

    if (!passwordMatch) {
      return res.status(400).json({
        message: "invalid email or password",
        data: null,
      });
    }

    req.session.learner = {
      id: learner.id,
      email: learner.email,
    };

    result = req.session.learner;

    message = "Learner logged in successfully";
    return res.status(200).json({ message, data: result });
  } catch (error) {
    message = "Failed to log in Learner: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

const checkCurrentUserController = (req, res) => {
  if (!req.session.learner) {
    return res.status(401).json({
      message: "Not authenticated",
      data: null,
    });
  }

  return res.status(200).json({
    message: "Authenticated",
    data: req.session.learner,
  });
};

const logoutController = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to log Learner out",
        data: null,
      });
    }

    res.clearCookie("connect.sid");

    return res.status(200).json({
      message: "Learner logged out successfully",
      data: null,
    });
  });
};

export {
  signUpController,
  loginController,
  checkCurrentUserController,
  logoutController,
};
