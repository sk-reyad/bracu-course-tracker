function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function completedCourseCodes(state) {
  return new Set(getCountedAttempts(state).map((attempt) => attempt.code));
}

function getAttemptPriority(status) {
  const map = { completed: 4, current: 3, planned: 2, omitted: 1 };
  return map[status] || 0;
}

function getCourseStatus(state, code) {
  const attempts = getAllAttempts(state).filter(
    (attempt) => attempt.code === code,
  );
  if (!attempts.length) return "not-started";
  if (getCountedAttempts(state).some((attempt) => attempt.code === code))
    return "completed";
  return attempts.reduce(
    (best, attempt) =>
      getAttemptPriority(attempt.status) > getAttemptPriority(best)
        ? attempt.status
        : best,
    "not-started",
  );
}

function getLatestAttempt(state, code) {
  const attempts = getAllAttempts(state).filter(
    (attempt) => attempt.code === code,
  );
  return attempts[attempts.length - 1] || null;
}

function checkPrerequisites(state, course) {
  const completed = completedCourseCodes(state);
  const missingHard = (course.hardPrerequisites || []).filter(
    (code) => !completed.has(code),
  );
  const missingSoft = (course.softPrerequisites || []).filter(
    (code) => !completed.has(code),
  );
  return { missingHard, missingSoft, eligible: missingHard.length === 0 };
}
