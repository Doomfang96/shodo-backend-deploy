import db from "../db/db.js";

const learnersController = async (req, res) => {
  const table = "learners";
  const fields = ["id", "email"];
  const sql = `SELECT ${fields.join(", ")} FROM ${table}`;

  let message = "";
  let result = null;

  //execute query
  try {
    const queryResult = await db.query(sql);
    result = queryResult.rows; //get rows from query result

    if (result.length === 0) {
      return res.status(200).json({
        message: "No learners found",
        data: [],
      });
    }

    message = "Learners found";
    return res.status(200).json({ message, data: result });
  } catch (error) {
    message = "Failed to execute query: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

const addLearnerController = async (req, res) => {
  const { email, password_hash } = req.body;

  if (!email || !password_hash) {
    return res.status(400).json({
      message: "email and password_hash are required",
      data: null,
    });
  }

  const sql =
    "INSERT INTO learners (email, password_hash) VALUES ($1, $2) RETURNING id, email";

  let message = "";
  let result = null;

  try {
    const queryResult = await db.query(sql, [email, password_hash]);
    result = queryResult.rows[0]; //get the inserted learner
    message = "Learner added successfully";
    return res.status(201).json({ message, data: result });
  } catch (error) {
    message = "Failed to add learner: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

export { learnersController, addLearnerController };
