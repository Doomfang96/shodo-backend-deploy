import db from "../db/db.js";
import updateSchedule from "../services/updateSchedule.js";

const reviewController = async (req, res) => {
  //controller? idk probably change to service later
  const learner_id = req.session.learner.id; //session, requires auth
  const { study_item_id, rating } = req.body;

  if (!learner_id || !study_item_id || !rating) {
    return res.status(400).json({
      message: "learner_id, study_item_id and rating are required",
      data: null,
    });
  }

  const validRatings = ["again", "hard", "good", "easy"]; //naming? ratings alone is unclear, validRatings?
  if (!validRatings.includes(rating)) {
    return res.status(400).json({
      message: "rating must be one of: again, hard, good, easy",
      data: null,
    });
  }

  let message = "";
  let result = null;
  let client = null; //client for transaction handling

  try {
    //new connection from pool
    client = await db.connect();

    //begin transaction
    await client.query("BEGIN");

    //get current study item
    const getItemSql = `
        SELECT *
        FROM study_items
        WHERE id = $1 AND learner_id = $2;
      `;

    const itemQuery = await client.query(getItemSql, [
      study_item_id,
      learner_id,
    ]);

    if (itemQuery.rows.length === 0) {
      await client.query("ROLLBACK"); //rollback transaction if study item not found
      return res
        .status(404)
        .json({ message: "Study item not found for this learner", data: null });
    }

    const studyItem = itemQuery.rows[0]; //current study item as constant

    //record review
    const insertReviewSql = `
        INSERT INTO review_events (learner_id, study_item_id, rating)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;

    const reviewQuery = await client.query(insertReviewSql, [
      learner_id,
      study_item_id,
      rating,
    ]);

    //new scheduler import
    const updatedValues = updateSchedule(studyItem, rating); //updated studyitem values

    //update study item
    const updateItemSql = `
            UPDATE study_items
            SET
                difficulty = $1,
                stability = $2,
                due_at = $3,
                last_reviewed_at = $4,
                reps = $5,
                lapses = $6
            WHERE id = $7 AND learner_id = $8
            RETURNING *;
        `;

    const updateQuery = await client.query(updateItemSql, [
      updatedValues.difficulty,
      updatedValues.stability,
      updatedValues.due_at,
      updatedValues.last_reviewed_at,
      updatedValues.reps,
      updatedValues.lapses,
      study_item_id,
      learner_id,
    ]);

    await client.query("COMMIT"); //commit update if all queries successful

    result = {
      review_event: reviewQuery.rows[0],
      updated_study_item: updateQuery.rows[0],
    };

    message = "Review recorded and study item updated";
    return res.status(200).json({ message, data: result });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK"); //rollback transaction if error occurs
    }
    message = "Failed to submit review: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  } finally {
    if (client) {
      client.release(); //release client back to pool
    }
  }
};

export default reviewController;
