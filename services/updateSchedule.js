const updateSchedule = (studyItem, rating) => {
  //set current values
  //have to wrap with number/date as postgres could return as string

  let difficulty = Number(studyItem.difficulty);
  let stability = Number(studyItem.stability);
  let reps = Number(studyItem.reps);
  let lapses = Number(studyItem.lapses);

  const now = new Date();
  const lastReviewed = studyItem.last_reviewed_at
    ? new Date(studyItem.last_reviewed_at)
    : null;
  const dueAt = studyItem.due_at ? new Date(studyItem.due_at) : null;

  let elapsedMs = 0; //stored as milliseconds
  let expectedIntervalMs = 0;

  if (lastReviewed) {
    elapsedMs = now - lastReviewed;
  }

  if (lastReviewed && dueAt) {
    expectedIntervalMs = dueAt - lastReviewed;
  }

  //update counters
  reps += 1;
  if (rating === "again") {
    lapses += 1;
  }

  //update difficulty between 1-10
  if (rating === "again") {
    difficulty += 0.2;
  } else if (rating === "hard") {
    difficulty += 0.1;
  } else if (rating === "easy") {
    difficulty -= 0.1;
  }

  //keep between 1-10 for multiplicative purposes
  if (difficulty < 1) difficulty = 1;
  if (difficulty > 10) difficulty = 10;

  //update stability
  if (rating === "again") {
    stability = 0.5;
  } else if (rating === "hard") {
    stability = stability * 1.2;
  } else if (rating === "good") {
    stability = stability * 1.6;
  } else if (rating === "easy") {
    stability = stability * 2.0;
  }

  //reward delayed recall
  if (
    rating !== "again" &&
    expectedIntervalMs > 0 &&
    elapsedMs > expectedIntervalMs + baseIntervalMs //adds one day for review to occur before multiplier
  ) {
    stability = stability * 1.1;
  }

  //calculate next due date
  const baseIntervalMs = 24 * 60 * 60 * 1000; // 1 day
  let intervalDays = stability * ((11 - difficulty) / 5); //max difficulty 10 so take from 11 to avoid 0, divide by 5 temporary scaling fix

  //failed recall should return soon
  if (rating === "again") {
    intervalDays = 0.25;
  }

  //minimum interval safeguard
  if (intervalDays < 0.25) {
    intervalDays = 0.25;
  }

  const intervalMs = intervalDays * baseIntervalMs;
  const nextDue = new Date(now.getTime() + intervalMs);

  return {
    difficulty,
    stability,
    reps,
    lapses,
    due_at: nextDue,
    last_reviewed_at: now,
  };
};

export default updateSchedule;
