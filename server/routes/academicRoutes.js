const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    createTask, getTasks, updateTask, deleteTask,
    createSubject, getSubjects, updateSubject, deleteSubject,
    getCalendarEvents, createCalendarEvent
} = require("../controllers/academicController");
const router = express.Router();
router.use(protect);
// Tasks
router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);
// Subjects
router.get("/subjects", getSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);
// Calendar
router.get("/calendar", getCalendarEvents);
router.post("/calendar", createCalendarEvent);
module.exports = router;
