import db from "../db/db.js";
import jlptN5Starter from "./jlptN5Set.js";

const createDefaultCollection = async (learner_id) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const insertCollectionSql = `
      INSERT INTO collections (learner_id, title)
      VALUES ($1, $2)
      RETURNING id;
    `;

    const collectionResult = await client.query(insertCollectionSql, [
      learner_id,
      "JLPT N5 Vocabulary",
    ]);

    const collection_id = collectionResult.rows[0].id;

    const insertItemSql = `
      INSERT INTO study_items (learner_id, collection_id, prompt, answer)
      VALUES ($1, $2, $3, $4);
    `;

    for (const item of jlptN5Starter) {
      await client.query(insertItemSql, [
        learner_id,
        collection_id,
        item.prompt,
        item.answer,
      ]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export default createDefaultCollection;
