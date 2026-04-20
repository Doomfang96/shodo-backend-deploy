import db from "../db/db.js";

const collectionsController = async (req, res) => {
  const learnerId = req.session.learner.id;

  const sql = `
        SELECT id, learner_id, title
        FROM collections
        WHERE learner_id = $1
        ORDER BY id;
    `;

  let message = "";
  let result = null;

  try {
    const queryResult = await db.query(sql, [learnerId]);
    result = queryResult.rows;

    if (result.length === 0) {
      return res.status(200).json({
        message: "No collections found",
        data: [],
      });
    }

    message = "Collections found";
    return res.status(200).json({ message, data: result });
  } catch (error) {
    message = "Failed to get collections: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

const addCollectionController = async (req, res) => {
  const { title } = req.body;
  const learner_id = req.session.learner.id; //session, requires auth

  if (!title) {
    return res.status(400).json({
      message: "title is required",
      data: null,
    });
  }

  const sql = `
        INSERT INTO collections (learner_id, title)
        VALUES ($1, $2)
        RETURNING id, learner_id, title;
    `;

  let message = "";
  let result = null;

  try {
    const queryResult = await db.query(sql, [learner_id, title]);
    result = queryResult.rows[0];
    message = "Collection created";
    return res.status(201).json({ message, data: result });
  } catch (error) {
    message = "Failed to create collection: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

export { collectionsController, addCollectionController };
