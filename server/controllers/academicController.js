const { db } = require("../config/db");

// ─── TASKS ────────────────────────────────────────────────────────────────────
async function createTask(req, res) {
    try {
        const { subject_id, title, description, deadline, difficulty, estimated_hours } = req.body;
        if (!title) return res.status(400).json({ message: "Task title is required" });

        const [result] = await db.execute(
            `INSERT INTO tasks (user_id, subject_id, title, description, deadline, difficulty, estimated_hours)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, subject_id || null, title, description || null,
             deadline || null, difficulty || "medium", estimated_hours || 2]
        );
        res.status(201).json({ message: "Task created", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getTasks(req, res) {
    try {
        const [rows] = await db.execute(
            `SELECT t.*, s.subject_name, s.color FROM tasks t
             LEFT JOIN subjects s ON t.subject_id = s.id
             WHERE t.user_id = ? ORDER BY t.deadline ASC, t.priority_score DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function updateTask(req, res) {
    try {
        const { title, description, deadline, difficulty, estimated_hours, status } = req.body;
        await db.execute(
            `UPDATE tasks SET title=COALESCE(?,title), description=COALESCE(?,description),
             deadline=COALESCE(?,deadline), difficulty=COALESCE(?,difficulty),
             estimated_hours=COALESCE(?,estimated_hours), status=COALESCE(?,status)
             WHERE id=? AND user_id=?`,
            [title, description, deadline, difficulty, estimated_hours, status, req.params.id, req.user.id]
        );
        res.json({ message: "Task updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteTask(req, res) {
    try {
        await db.execute("DELETE FROM tasks WHERE id=? AND user_id=?", [req.params.id, req.user.id]);
        res.json({ message: "Task deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ─── SUBJECTS ─────────────────────────────────────────────────────────────────
async function createSubject(req, res) {
    try {
        const { subject_name, priority_level, color } = req.body;
        if (!subject_name) return res.status(400).json({ message: "Subject name is required" });

        const [result] = await db.execute(
            "INSERT INTO subjects (user_id, subject_name, priority_level, color) VALUES (?, ?, ?, ?)",
            [req.user.id, subject_name, priority_level || "medium", color || "#7b68ee"]
        );
        res.status(201).json({ message: "Subject created", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getSubjects(req, res) {
    try {
        const [rows] = await db.execute(
            "SELECT s.*, COUNT(t.id) as task_count FROM subjects s LEFT JOIN tasks t ON t.subject_id = s.id WHERE s.user_id = ? GROUP BY s.id",
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function updateSubject(req, res) {
    try {
        const { subject_name, priority_level, color } = req.body;
        await db.execute(
            "UPDATE subjects SET subject_name=COALESCE(?,subject_name), priority_level=COALESCE(?,priority_level), color=COALESCE(?,color) WHERE id=? AND user_id=?",
            [subject_name, priority_level, color, req.params.id, req.user.id]
        );
        res.json({ message: "Subject updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteSubject(req, res) {
    try {
        await db.execute("DELETE FROM subjects WHERE id=? AND user_id=?", [req.params.id, req.user.id]);
        res.json({ message: "Subject deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
async function getCalendarEvents(req, res) {
    try {
        const { start, end } = req.query;
        let query = "SELECT * FROM calendar_events WHERE user_id = ?";
        const params = [req.user.id];
        if (start) { query += " AND start_time >= ?"; params.push(start); }
        if (end) { query += " AND end_time <= ?"; params.push(end); }
        query += " ORDER BY start_time ASC";

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function createCalendarEvent(req, res) {
    try {
        const { title, start_time, end_time, event_type, subject_id, task_id, color, notes } = req.body;
        if (!title || !start_time || !end_time) return res.status(400).json({ message: "title, start_time, end_time required" });

        const [result] = await db.execute(
            `INSERT INTO calendar_events (user_id, subject_id, task_id, title, start_time, end_time, event_type, color, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, subject_id || null, task_id || null, title, start_time, end_time,
             event_type || "study", color || "#7b68ee", notes || null]
        );
        res.status(201).json({ message: "Event created", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createTask, getTasks, updateTask, deleteTask,
    createSubject, getSubjects, updateSubject, deleteSubject,
    getCalendarEvents, createCalendarEvent
};
