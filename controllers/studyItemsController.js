import db from "../db/db.js";

const studyItemsController = async (req, res) => {
  const learner_id = req.session.learner.id;
  const { collectionId } = req.params;
  //now checks ownership of collection for studyitems
  const sql = `
        SELECT si.id, si.collection_id, si.prompt, si.answer
        FROM study_items si
        JOIN collections c ON si.collection_id = c.id
        WHERE si.collection_id = $1
        AND c.learner_id = $2
        ORDER BY si.id;
    `;

  let message = "";
  let result = null;

  try {
    const queryResult = await db.query(sql, [collectionId, learner_id]);

    result = queryResult.rows;

    if (result.length === 0) {
      return res.status(200).json({
        message: "No study items found",
        data: [],
      });
    }

    message = "Study items found";
    return res.status(200).json({ message, data: result });
  } catch (error) {
    message = "Failed to get study items: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

const addStudyItemController = async (req, res) => {
  const learner_id = req.session.learner.id; //session, requires auth
  const { collection_id, prompt, answer } = req.body;

  if (!learner_id || !collection_id || !prompt || !answer) {
    return res.status(400).json({
      message: "learner_id, collection_id, prompt and answer are required",
      data: null,
    });
  }

  //ownership check

  const checkOwnershipSql = `
        SELECT *
        FROM collections
        WHERE id = $1 AND learner_id = $2;
    `;

  let message = "";
  let result = null;

  try {
    //ownership check trycatch
    const ownershipCheck = await db.query(checkOwnershipSql, [
      collection_id,
      learner_id,
    ]);

    if (ownershipCheck.rows.length === 0) {
      return res.status(400).json({
        message: "collection_id does not belong to learner_id",
        data: null,
      });
    }

    const sql = `
        INSERT INTO study_items (
            learner_id,
            collection_id,
            prompt,
            answer
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, learner_id, collection_id, prompt, answer, difficulty, stability, due_at, last_reviewed_at, reps, lapses;
    `;

    const queryResult = await db.query(sql, [
      learner_id,
      collection_id,
      prompt,
      answer,
    ]);
    result = queryResult.rows[0];
    message = "Study item created";
    return res.status(201).json({ message, data: result });
  } catch (error) {
    message = "Failed to create study item: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

const dueStudyItemsController = async (req, res) => {
  const learnerId = req.session.learner.id; //session, requires auth

  const sql = `
        SELECT *
        FROM study_items
        WHERE learner_id = $1
          AND due_at <= NOW()
        ORDER BY due_at ASC;
    `;

  let message = "";
  let result = null;

  try {
    const queryResult = await db.query(sql, [learnerId]);
    result = queryResult.rows;

    if (result.length === 0) {
      return res.status(200).json({
        message: "No due study items found",
        data: [],
      });
    }

    message = "Due study items found";
    return res.status(200).json({ message, data: result });
  } catch (error) {
    message = "Failed to get due study items: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

export {
  studyItemsController,
  addStudyItemController,
  dueStudyItemsController,
};
