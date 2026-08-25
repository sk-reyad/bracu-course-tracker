function getGradePoint(state, grade) {
  const item = state.gradeScale.find((entry) => entry.grade === grade);
  return item ? item.point : null;
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "0.00";
  return Number(value).toFixed(digits);
}

function courseByCode(state, code) {
  return state.courses.find((course) => course.code === code);
}

function getAllAttempts(state) {
  return state.semesters.flatMap((semester, semesterIndex) =>
    (semester.courses || []).map((attempt) => ({
      ...attempt,
      semesterId: semester.id,
      semesterName: semester.name,
      semesterNumber: semester.number || semesterIndex + 1,
    })),
  );
}

function attemptGradePoint(state, attempt) {
  return attempt.gradePoint ?? getGradePoint(state, attempt.grade);
}

function getBestAttemptIds(state) {
  const best = new Map();
  getAllAttempts(state).forEach((attempt) => {
    if (attempt.status !== "completed") return;
    const point = attemptGradePoint(state, attempt);
    if (point === null || point === undefined) return;
    if (
      attempt.countsInCGPA === false &&
      state.settings.autoCountHighestRetake === false
    )
      return;
    const current = best.get(attempt.code);
    if (
      !current ||
      Number(point) > Number(current.point) ||
      (Number(point) === Number(current.point) &&
        new Date(attempt.createdAt || 0) > new Date(current.createdAt || 0))
    ) {
      best.set(attempt.code, {
        id: attempt.id,
        point,
        createdAt: attempt.createdAt,
      });
    }
  });
  return new Set([...best.values()].map((item) => item.id));
}

function isAttemptCounted(state, attempt) {
  if (attempt.status !== "completed") return false;
  const point = attemptGradePoint(state, attempt);
  if (point === null || point === undefined) return false;
  return getBestAttemptIds(state).has(attempt.id);
}

function getCountedAttempts(state) {
  const ids = getBestAttemptIds(state);
  return getAllAttempts(state).filter((attempt) => ids.has(attempt.id));
}

function calculateGpaForAttempts(state, attempts) {
  let totalPoints = 0;
  let totalCredits = 0;

  attempts.forEach((attempt) => {
    const course = courseByCode(state, attempt.code);
    const credits = Number(attempt.creditsOverride || course?.credits || 0);
    const point = attemptGradePoint(state, attempt);
    if (credits > 0 && point !== null && point !== undefined) {
      totalCredits += credits;
      totalPoints += credits * Number(point);
    }
  });

  return {
    credits: totalCredits,
    qualityPoints: totalPoints,
    gpa: totalCredits ? totalPoints / totalCredits : 0,
  };
}

function calculateSemesterGpa(state, semester) {
  const countedIds = getBestAttemptIds(state);
  const attempts = (semester.courses || []).filter((attempt) =>
    countedIds.has(attempt.id),
  );
  return calculateGpaForAttempts(state, attempts);
}

function calculateCumulativeAfterSemester(state, semesterIndex) {
  const allowedIds = new Set();
  state.semesters.slice(0, semesterIndex + 1).forEach((semester) => {
    (semester.courses || []).forEach((attempt) => allowedIds.add(attempt.id));
  });
  const attempts = getCountedAttempts(state).filter((attempt) =>
    allowedIds.has(attempt.id),
  );
  return calculateGpaForAttempts(state, attempts);
}

function calculateSummary(state) {
  const attempts = getAllAttempts(state);
  const counted = getCountedAttempts(state);
  const cgpa = calculateGpaForAttempts(state, counted);
  const completedCodes = new Set(counted.map((attempt) => attempt.code));
  const currentAttempts = attempts.filter(
    (attempt) => attempt.status === "current",
  );
  const plannedAttempts = attempts.filter(
    (attempt) => attempt.status === "planned",
  );
  const omittedAttempts = attempts.filter(
    (attempt) =>
      attempt.status === "omitted" ||
      (attempt.status === "completed" && !isAttemptCounted(state, attempt)),
  );
  const completedSemesters = state.semesters.filter((semester) =>
    (semester.courses || []).some((attempt) => attempt.status === "completed"),
  ).length;
  const activeSemester =
    state.semesters.find((semester) =>
      (semester.courses || []).some((attempt) => attempt.status === "current"),
    )?.name || "Not selected";

  const completedCredits = counted.reduce((sum, attempt) => {
    const course = courseByCode(state, attempt.code);
    return sum + Number(attempt.creditsOverride || course?.credits || 0);
  }, 0);
  const currentCredits = currentAttempts.reduce((sum, attempt) => {
    const course = courseByCode(state, attempt.code);
    return sum + Number(attempt.creditsOverride || course?.credits || 0);
  }, 0);
  const plannedCredits = plannedAttempts.reduce((sum, attempt) => {
    const course = courseByCode(state, attempt.code);
    return sum + Number(attempt.creditsOverride || course?.credits || 0);
  }, 0);
  const remainingCredits = Math.max(
    DEFAULT_DATA.program.requiredCredits - completedCredits,
    0,
  );

  return {
    totalRequired: DEFAULT_DATA.program.requiredCredits,
    completedCredits,
    currentCredits,
    plannedCredits,
    remainingCredits,
    cgpa: cgpa.gpa,
    countedCredits: cgpa.credits,
    completedCourses: completedCodes.size,
    currentCourses: currentAttempts.length,
    plannedCourses: plannedAttempts.length,
    omittedAttempts: omittedAttempts.length,
    completedSemesters,
    activeSemester,
    progressPercent: Math.min(
      100,
      (completedCredits / DEFAULT_DATA.program.requiredCredits) * 100,
    ),
  };
}
