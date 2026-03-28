const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    generateFlashcards, getFlashcards, reviewFlashcard,
    generateQuiz, submitQuiz,
    chatWithTutor,
    predictExam, getRecommendations,
    getProgress, generateCalendar,
    generateTimetable, getTimetable,
    assessDifficulty, checkWorkload,
    submitFeedback, prioritizeTasks
} = require("../controllers/aiController");
const router = express.Router();
router.use(protect);
router.post("/flashcards/generate", generateFlashcards);
router.get("/flashcards", getFlashcards);
router.post("/flashcards/:id/review", reviewFlashcard);
router.post("/quiz/generate", generateQuiz);
router.post("/quiz/submit", submitQuiz);
router.post("/tutor/chat", chatWithTutor);
router.post("/predict-exam", predictExam);
router.get("/recommendations", getRecommendations);
router.get("/progress", getProgress);
router.post("/calendar/generate", generateCalendar);
router.post("/timetable/generate", generateTimetable);
router.get("/timetable", getTimetable);
router.get("/difficulty", assessDifficulty);
router.get("/workload", checkWorkload);
router.post("/feedback", submitFeedback);
router.get("/prioritize", prioritizeTasks);
module.exports = router;
