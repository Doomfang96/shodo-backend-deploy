import db from "../db/db.js";

const progressSummaryController = async (req, res) => {
  const learner_id = req.session.learner.id;

  let message = "";
  let result = null;

  try {
    const totalReviewsSql = `
      SELECT COUNT(*)::int AS total_reviews
      FROM review_events
      WHERE learner_id = $1;
    `;

    const totalLapsesSql = `
      SELECT COALESCE(SUM(lapses), 0)::int AS total_lapses
      FROM study_items
      WHERE learner_id = $1;
    `;

    const dueItemsSql = `
      SELECT COUNT(*)::int AS due_items
      FROM study_items
      WHERE learner_id = $1
      AND due_at <= NOW();
    `;

    const totalCollectionsSql = `
      SELECT COUNT(*)::int AS total_collections
      FROM collections
      WHERE learner_id = $1;
    `;

    const totalStudyItemsSql = `
      SELECT COUNT(*)::int AS total_study_items
      FROM study_items
      WHERE learner_id = $1;
    `;

    const [
      totalReviewsQuery,
      totalLapsesQuery,
      dueItemsQuery,
      totalCollectionsQuery,
      totalStudyItemsQuery,
    ] = await Promise.all([
      db.query(totalReviewsSql, [learner_id]),
      db.query(totalLapsesSql, [learner_id]),
      db.query(dueItemsSql, [learner_id]),
      db.query(totalCollectionsSql, [learner_id]),
      db.query(totalStudyItemsSql, [learner_id]),
    ]);

    result = {
      total_reviews: totalReviewsQuery.rows[0].total_reviews,
      total_lapses: totalLapsesQuery.rows[0].total_lapses,
      due_items: dueItemsQuery.rows[0].due_items,
      total_collections: totalCollectionsQuery.rows[0].total_collections,
      total_study_items: totalStudyItemsQuery.rows[0].total_study_items,
    };

    message = "Progressretrieved";
    return res.status(200).json({ message, data: result });
  } catch (error) {
    message = "Failed to retrieve progress: " + error.message;
    console.error(error);
    return res.status(500).json({ message, data: null });
  }
};

export default progressSummaryController;
