const { db } = require("../config/db");
const crypto = require("crypto");

let flashcardStatusColumnEnsured = false;
async function ensureFlashcardStatusColumn() {
    if (flashcardStatusColumnEnsured) return;
    const [rows] = await db.execute("SHOW COLUMNS FROM flashcards LIKE 'status'");
    if (rows.length === 0) {
        await db.execute("ALTER TABLE flashcards ADD COLUMN status ENUM('active','archived') DEFAULT 'active'");
    }
    flashcardStatusColumnEnsured = true;
}

async function getAIConfig() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("No AI API key configured. Add GEMINI_API_KEY to .env");
    }

    return {
      provider: "gemini",
      apiKey,
      model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
      endpoint: process.env.GEMINI_API_URL || `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent`
    };
}

async function callAI(systemPrompt, userPrompt, jsonMode = false) {
    const { apiKey, model } = await getAIConfig();
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const body = {
        contents: [{
            parts: [
                { text: systemPrompt },
                { text: userPrompt }
            ]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000,
            ...(jsonMode && { responseMimeType: "application/json" })
        }
    };

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`AI request error ${res.status}: ${err}`);
        }

        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

async function callAIMessages(messages) {
    const { apiKey, model } = await getAIConfig();
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    // Convert from OpenAI format to Gemini format if needed
    const parts = messages.map(msg => ({ text: msg.content }));

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1200
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`AI request error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callAIStream(messages, onChunk) {
    const { apiKey, model } = await getAIConfig();
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?key=${apiKey}`;

    const parts = messages.map(msg => ({ text: msg.content }));

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1200
            }
        })
    });

    if (!res.ok) throw new Error(`AI stream error ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        try {
            const parsed = JSON.parse(chunk);
            const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (delta) { full += delta; onChunk(delta); }
        } catch {}
    }
    return full;
}

async function getMaterialText(materialId, userId) {
    const [rows] = await db.execute(
        "SELECT extracted_text, title, file_type, youtube_url FROM materials WHERE id = ? AND user_id = ?",
        [materialId, userId]
    );
    if (rows.length === 0) throw new Error("Material not found");
    if (rows[0].status === "processing") throw new Error("Material is still processing. Please wait.");
    if (!rows[0].extracted_text && rows[0].file_type !== "youtube") {
        throw new Error("No text extracted from this material yet.");
    }
    return rows[0];
}

async function generateStudyPlan(req, res) {
    try {
        const { material_id, subject_id, length = 7, focus } = req.body;
        if (!material_id) return res.status(400).json({ message: "material_id is required" });

        const material = await getMaterialText(material_id, req.user.id);
        const textSnippet = (material.extracted_text || "").slice(0, 10000);

        const systemPrompt = `You are an expert study planner for university students.
Create a practical ${length}-day study plan based on the provided course material.
Return ONLY valid JSON:
{
  "study_plan": [
    {
      "day": 1,
      "focus": "...",
      "topics": ["..."],
      "activities": ["..."],
      "estimated_time_hours": 1.5,
      "tips": "..."
    }
  ],
  "summary": "...",
  "next_steps": "..."
}`;

        const userPrompt = `Material title: "${material.title}"
${focus ? `Focus: ${focus}
` : ""}
Please create a ${length}-day study plan from the material below. Use the most important concepts, practical review tasks, and clear next steps.

Material content:
${textSnippet}`;

        const raw = await callAI(systemPrompt, userPrompt, true);
        const result = JSON.parse(raw);
        res.json(result);
    } catch (error) {
        console.error("Study plan error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function generateFlashcards(req, res) {
    try {
        const { material_id, subject_id, count = 10, topic } = req.body;
        if (!material_id) return res.status(400).json({ message: "material_id is required" });

        const material = await getMaterialText(material_id, req.user.id);
        const textSnippet = (material.extracted_text || "").slice(0, 6000);

        const systemPrompt = `You are an expert educator creating university-level flashcards. 
Generate exactly ${count} flashcards from the provided study material.
Return ONLY valid JSON in this exact format:
{
  "flashcards": [
    { "question": "...", "answer": "...", "topic": "...", "difficulty": "easy|medium|hard" }
  ]
}`;

        const userPrompt = `Generate ${count} flashcards from this material titled "${material.title}".
${topic ? `Focus on the topic: ${topic}` : ""}

Material content:
${textSnippet}`;

        const raw = await callAI(systemPrompt, userPrompt, true);
        const parsed = JSON.parse(raw);
        const cards = parsed.flashcards || [];

        const saved = [];
        for (const card of cards) {
            const [result] = await db.execute(
                `INSERT INTO flashcards (user_id, material_id, subject_id, question, answer, topic, difficulty)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, material_id, subject_id || null, card.question, card.answer,
                 card.topic || topic || material.title, card.difficulty || "medium"]
            );
            saved.push({ id: result.insertId, ...card });
        }

        res.status(201).json({
            message: `${saved.length} flashcards generated successfully`,
            flashcards: saved
        });
    } catch (error) {
        console.error("Flashcard generation error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function getFlashcards(req, res) {
    try {
        await ensureFlashcardStatusColumn();
        const { subject_id, material_id, status } = req.query;
        let query = "SELECT f.*, s.subject_name FROM flashcards f LEFT JOIN subjects s ON f.subject_id = s.id WHERE f.user_id = ?";
        const params = [req.user.id];

        if (status === "archived") {
            query += " AND f.status = 'archived'";
        } else if (status === "active") {
            query += " AND (f.status = 'active' OR f.status IS NULL)";
        }
        if (subject_id) { query += " AND f.subject_id = ?"; params.push(subject_id); }
        if (material_id) { query += " AND f.material_id = ?"; params.push(material_id); }
        query += " ORDER BY f.created_at DESC";

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function reviewFlashcard(req, res) {
    try {
        const { id } = req.params;
        const { correct } = req.body;

        const [rows] = await db.execute(
            "SELECT times_reviewed, correct_count FROM flashcards WHERE id = ? AND user_id = ?",
            [id, req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: "Flashcard not found" });

        const card = rows[0];
        const newCorrect = card.correct_count + (correct ? 1 : 0);
        const newReviewed = card.times_reviewed + 1;
        const accuracy = newCorrect / newReviewed;

        let daysUntilReview = 1;
        if (accuracy >= 0.9) daysUntilReview = 14;
        else if (accuracy >= 0.7) daysUntilReview = 7;
        else if (accuracy >= 0.5) daysUntilReview = 3;

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + daysUntilReview);

        await db.execute(
            "UPDATE flashcards SET times_reviewed = ?, correct_count = ?, next_review_at = ? WHERE id = ?",
            [newReviewed, newCorrect, nextReview, id]
        );

        res.json({ message: "Review recorded", next_review_at: nextReview, accuracy: Math.round(accuracy * 100) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function updateFlashcard(req, res) {
    try {
        await ensureFlashcardStatusColumn();
        const { status } = req.body;
        if (!["active", "archived"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        await db.execute(
            "UPDATE flashcards SET status = ? WHERE id = ? AND user_id = ?",
            [status, req.params.id, req.user.id]
        );
        res.json({ message: "Flashcard updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteFlashcard(req, res) {
    try {
        await db.execute("DELETE FROM flashcards WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
        res.json({ message: "Flashcard deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function generateQuiz(req, res) {
    try {
        const { material_id, subject_id, count = 10, difficulty = "medium", topic } = req.body;
        if (!material_id) return res.status(400).json({ message: "material_id is required" });

        const material = await getMaterialText(material_id, req.user.id);
        const textSnippet = (material.extracted_text || "").slice(0, 6000);
        const sessionId = `quiz_${Date.now()}_${req.user.id}`;

        const systemPrompt = `You are a university exam setter creating rigorous multiple choice questions.
Generate exactly ${count} MCQ questions from the provided material.
Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "answer": "A|B|C|D",
      "explanation": "...",
      "topic": "...",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

        const userPrompt = `Generate ${count} ${difficulty} difficulty MCQ questions from: "${material.title}"
${topic ? `Focus on: ${topic}` : ""}

Material:
${textSnippet}`;

        const raw = await callAI(systemPrompt, userPrompt, true);
        const parsed = JSON.parse(raw);
        const questions = parsed.questions || [];

        const saved = [];
        for (const q of questions) {
            const [result] = await db.execute(
                `INSERT INTO quiz_questions (user_id, material_id, subject_id, quiz_session_id, question,
                 option_a, option_b, option_c, option_d, answer, explanation, topic, difficulty)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, material_id, subject_id || null, sessionId,
                 q.question, q.option_a, q.option_b, q.option_c, q.option_d,
                 q.answer, q.explanation, q.topic || topic || material.title, q.difficulty || difficulty]
            );
            saved.push({ id: result.insertId, ...q });
        }

        res.status(201).json({
            message: `${saved.length} quiz questions generated`,
            session_id: sessionId,
            questions: saved
        });
    } catch (error) {
        console.error("Quiz generation error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function submitQuiz(req, res) {
    try {
        const { session_id, answers } = req.body;
        if (!session_id || !answers) return res.status(400).json({ message: "session_id and answers required" });

        let correct = 0;
        const results = [];

        for (const a of answers) {
            const [qRows] = await db.execute("SELECT answer, explanation FROM quiz_questions WHERE id = ?", [a.question_id]);
            if (qRows.length === 0) continue;

            const isCorrect = qRows[0].answer === a.selected_answer;
            if (isCorrect) correct++;

            await db.execute(
                `INSERT INTO quiz_attempts (user_id, quiz_session_id, question_id, selected_answer, is_correct, time_taken_seconds)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.user.id, session_id, a.question_id, a.selected_answer, isCorrect, a.time_taken_seconds || 0]
            );

            results.push({
                question_id: a.question_id,
                selected: a.selected_answer,
                correct: qRows[0].answer,
                is_correct: isCorrect,
                explanation: qRows[0].explanation
            });
        }

        const score = Math.round((correct / answers.length) * 100);

        await db.execute(
            `INSERT INTO progress (user_id, date, quiz_score) VALUES (?, CURDATE(), ?)
             ON DUPLICATE KEY UPDATE quiz_score = ?`,
            [req.user.id, score, score]
        );

        res.json({ score, correct, total: answers.length, results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function chatWithTutor(req, res) {
    try {
        const { message, material_id, session_id } = req.body;
        if (!message) return res.status(400).json({ message: "Message is required" });

        const sid = session_id || `session_${Date.now()}`;
        let context = "";

        if (material_id) {
            const [mRows] = await db.execute(
                "SELECT extracted_text, title FROM materials WHERE id = ? AND user_id = ?",
                [material_id, req.user.id]
            );
            if (mRows.length > 0 && mRows[0].extracted_text) {
                context = `\n\nCOURSE MATERIAL (${mRows[0].title}):\n${mRows[0].extracted_text.slice(0, 4000)}`;
            }
        }

        const [history] = await db.execute(
            "SELECT role, content FROM chat_history WHERE session_id = ? AND user_id = ? ORDER BY created_at ASC LIMIT 10",
            [sid, req.user.id]
        );

        await db.execute(
            "INSERT INTO chat_history (user_id, material_id, session_id, role, content) VALUES (?, ?, ?, 'user', ?)",
            [req.user.id, material_id || null, sid, message]
        );

        const systemPrompt = `You are Spark.E, an intelligent AI study tutor for university students. 
You are knowledgeable, encouraging, and precise. You explain complex concepts clearly using examples and analogies.
When given course material, you answer based on it. You can also help with general academic questions.
Keep responses concise but thorough. Use bullet points and structure when helpful.${context}`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: message }
        ];

        const reply = await callAIMessages(messages);

        await db.execute(
            "INSERT INTO chat_history (user_id, material_id, session_id, role, content) VALUES (?, ?, ?, 'assistant', ?)",
            [req.user.id, material_id || null, sid, reply]
        );

        res.json({ reply, session_id: sid });
    } catch (error) {
        console.error("Tutor chat error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function predictExam(req, res) {
    try {
        const { subject_id, material_ids } = req.body;

        let query = "SELECT extracted_text, title FROM materials WHERE user_id = ? AND status = 'ready'";
        const params = [req.user.id];
        if (subject_id) { query += " AND subject_id = ?"; params.push(subject_id); }
        if (material_ids?.length) { query += ` AND id IN (${material_ids.map(() => "?").join(",")})`;  params.push(...material_ids); }

        const [materials] = await db.execute(query, params);
        if (materials.length === 0) return res.status(400).json({ message: "No processed materials found for prediction" });

        const combinedText = materials
            .map(m => `[${m.title}]: ${(m.extracted_text || "").slice(0, 2000)}`)
            .join("\n\n")
            .slice(0, 8000);

        const systemPrompt = `You are an expert educator analyzing course materials to predict likely exam topics.
Return ONLY valid JSON:
{
  "predictions": [
    {
      "topic": "...",
      "likelihood": "high|medium|low",
      "confidence": 85,
      "reasoning": "...",
      "suggested_questions": ["...", "..."]
    }
  ],
  "study_advice": "..."
}`;

        const raw = await callAI(systemPrompt, `Analyze these course materials and predict the most likely exam topics:\n\n${combinedText}`, true);
        const result = JSON.parse(raw);

        if (subject_id) {
            await db.execute(
                "INSERT INTO exam_predictions (user_id, subject_id, predicted_topics, confidence_scores) VALUES (?, ?, ?, ?)",
                [req.user.id, subject_id, JSON.stringify(result.predictions), JSON.stringify(result.predictions.map(p => p.confidence))]
            );
        }

        res.json(result);
    } catch (error) {
        console.error("Prediction error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function getRecommendations(req, res) {
    try {
        const userId = req.user.id;

        const [progress] = await db.execute(
            "SELECT * FROM progress WHERE user_id = ? ORDER BY created_at DESC LIMIT 14",
            [userId]
        );
        const [subjects] = await db.execute(
            "SELECT * FROM subjects WHERE user_id = ?",
            [userId]
        );
        const [tasks] = await db.execute(
            "SELECT * FROM tasks WHERE user_id = ? AND status != 'completed' ORDER BY deadline ASC LIMIT 10",
            [userId]
        );

        const systemPrompt = `You are an AI academic advisor. Based on student performance data, provide personalized study recommendations.
Return ONLY valid JSON:
{
  "recommendations": [
    { "type": "focus_area|schedule|technique|resource", "title": "...", "description": "...", "priority": "high|medium|low" }
  ],
  "weekly_goal": "...",
  "motivational_message": "...",
  "next_study": "...",
  "study_plan_suggestion": "..."
}`;

        const contextData = {
            recent_progress: progress.slice(0, 7),
            subjects: subjects.map(s => ({ name: s.subject_name, mastery: s.mastery_score })),
            pending_tasks: tasks.length,
            upcoming_deadlines: tasks.slice(0, 3).map(t => ({ title: t.title, deadline: t.deadline }))
        };

        const raw = await callAI(systemPrompt, `Student data: ${JSON.stringify(contextData)}`, true);
        res.json(JSON.parse(raw));
    } catch (error) {
        console.error("Recommendations error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function getProgress(req, res) {
    try {
        const userId = req.user.id;

        const [bySubject] = await db.execute(
            `SELECT s.subject_name, s.mastery_score, s.color,
             COUNT(DISTINCT t.id) as total_tasks,
             SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END) as completed_tasks,
             AVG(qa.is_correct * 100) as avg_quiz_score
             FROM subjects s
             LEFT JOIN tasks t ON t.subject_id = s.id AND t.user_id = ?
             LEFT JOIN quiz_questions qq ON qq.subject_id = s.id AND qq.user_id = ?
             LEFT JOIN quiz_attempts qa ON qa.question_id = qq.id AND qa.user_id = ?
             WHERE s.user_id = ?
             GROUP BY s.id`,
            [userId, userId, userId, userId]
        );

        const [weekly] = await db.execute(
            `SELECT DATE(created_at) as date, SUM(study_hours) as hours, AVG(quiz_score) as score
             FROM progress WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at) ORDER BY date ASC`,
            [userId]
        );

        const [flashcardStats] = await db.execute(
            "SELECT COUNT(*) as total, SUM(times_reviewed) as reviews, AVG(correct_count/NULLIF(times_reviewed,0)*100) as accuracy FROM flashcards WHERE user_id = ?",
            [userId]
        );

        res.json({ by_subject: bySubject, weekly, flashcard_stats: flashcardStats[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function generateCalendar(req, res) {
    try {
        const userId = req.user.id;
        const { start_date, end_date } = req.body;

        const [tasks] = await db.execute(
            "SELECT t.*, s.subject_name FROM tasks t LEFT JOIN subjects s ON t.subject_id = s.id WHERE t.user_id = ? AND t.status != 'completed' ORDER BY t.deadline ASC",
            [userId]
        );

        const [user] = await db.execute("SELECT daily_study_hours, study_preference FROM users WHERE id = ?", [userId]);
        const userData = user[0];

        const systemPrompt = `You are an AI study scheduler. Create an optimized study calendar.
Return ONLY valid JSON:
{
  "events": [
    {
      "title": "...",
      "start_time": "2025-01-15T09:00:00",
      "end_time": "2025-01-15T11:00:00",
      "event_type": "study|revision|break",
      "subject": "...",
      "task_title": "...",
      "color": "#hexcolor"
    }
  ]
}`;

        const prompt = `Create a study schedule from ${start_date} to ${end_date}.
User studies ${userData.daily_study_hours}h/day, prefers ${userData.study_preference} sessions.
Tasks to schedule: ${JSON.stringify(tasks.map(t => ({ title: t.title, subject: t.subject_name, deadline: t.deadline, hours: t.estimated_hours, difficulty: t.difficulty })))}`;

        const raw = await callAI(systemPrompt, prompt, true);
        const { events } = JSON.parse(raw);

        const saved = [];
        for (const ev of events || []) {
            const [result] = await db.execute(
                `INSERT INTO calendar_events (user_id, title, start_time, end_time, event_type, is_ai_generated, color)
                 VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
                [userId, ev.title, ev.start_time, ev.end_time, ev.event_type || "study", ev.color || "#7b68ee"]
            );
            saved.push({ id: result.insertId, ...ev });
        }

        res.json({ message: `${saved.length} calendar events generated`, events: saved });
    } catch (error) {
        console.error("Calendar generation error:", error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    generateFlashcards,
    getFlashcards,
    reviewFlashcard,
    generateQuiz,
    submitQuiz,
    chatWithTutor,
    predictExam,
    getRecommendations,
    getProgress,
    generateCalendar,
    generateStudyPlan,
    updateFlashcard,
    deleteFlashcard
};

async function generateTimetable(req, res) {
    try {
        const userId = req.user.id;
        const { date, days = 7 } = req.body;
        const targetDate = date || new Date().toISOString().split("T")[0];

        const [tasks] = await db.execute(
            `SELECT t.*, s.subject_name, s.color FROM tasks t
             LEFT JOIN subjects s ON t.subject_id = s.id
             WHERE t.user_id = ? AND t.status != 'completed'
             ORDER BY t.deadline ASC`,
            [userId]
        );

        const [user] = await db.execute(
            "SELECT name, daily_study_hours, study_preference FROM users WHERE id = ?",
            [userId]
        );

        const [perf] = await db.execute(
            `SELECT AVG(quiz_score) as avg_score FROM progress
             WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)`,
            [userId]
        );

        const avgScore = parseFloat(perf[0]?.avg_score) || 50;
        const difficultyLevel = avgScore >= 75 ? "Advanced" : avgScore >= 50 ? "Intermediate" : "Beginner";
        const userData = user[0] || { daily_study_hours: 4, study_preference: "morning" };

        const systemPrompt = `You are an expert academic timetable planner for university students.
Generate a ${days}-day daily study timetable starting from ${targetDate}.
Student level: ${difficultyLevel} (quiz avg: ${Math.round(avgScore)}%)

RULES:
- Daily study hours: ${userData.daily_study_hours}h/day, preferred time: ${userData.study_preference}
- Include 15-min breaks between 90-min sessions
- Hard tasks = 90-120 min blocks, Easy tasks = 30-45 min
- Spread workload evenly. Nearest deadlines get first slots.
- ${difficultyLevel === "Beginner" ? "Add extra review sessions." : difficultyLevel === "Advanced" ? "Include deep-dive sessions." : "Balance practice and theory."}

Return ONLY valid JSON:
{
  "difficulty_level": "Beginner|Intermediate|Advanced",
  "avg_score": 72,
  "timetable": [
    {
      "date": "YYYY-MM-DD",
      "day_name": "Monday",
      "total_study_minutes": 240,
      "sessions": [
        {
          "start_time": "09:00",
          "end_time": "10:30",
          "subject": "...",
          "task_title": "...",
          "activity": "Study|Revision|Practice|Break",
          "duration_minutes": 90,
          "difficulty": "easy|medium|hard",
          "notes": "Session goal or focus tip",
          "color": "#hexcolor"
        }
      ]
    }
  ],
  "weekly_summary": "...",
  "ai_tips": ["tip1", "tip2", "tip3"]
}`;

        const raw = await callAI(systemPrompt,
            `Generate ${days}-day timetable from ${targetDate}. Tasks: ${JSON.stringify(tasks.map(t => ({
                title: t.title, subject: t.subject_name, deadline: t.deadline,
                difficulty: t.difficulty, hours: t.estimated_hours
            })))}`,
            true
        );

        const result = JSON.parse(raw);

        if (result.timetable) {
            try {
                await db.execute("DELETE FROM timetable_slots WHERE user_id = ? AND date >= ?", [userId, targetDate]);
                for (const day of result.timetable) {
                    for (const s of (day.sessions || [])) {
                        if (s.activity === "Break") continue;
                        await db.execute(
                            `INSERT INTO timetable_slots (user_id, date, start_time, end_time, subject, task_title, activity, duration_minutes, difficulty, notes, color)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [userId, day.date, s.start_time, s.end_time, s.subject, s.task_title,
                             s.activity, s.duration_minutes, s.difficulty, s.notes, s.color || "#7b68ee"]
                        );
                    }
                }
            } catch(dbErr) { console.warn("Timetable DB save skipped:", dbErr.message); }
        }

        res.json({ ...result, message: `${days}-day timetable at ${difficultyLevel} level` });
    } catch (error) {
        console.error("Timetable error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function getTimetable(req, res) {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split("T")[0];
        try {
            const [rows] = await db.execute(
                `SELECT * FROM timetable_slots WHERE user_id = ?
                 AND date >= ?
                 ORDER BY date ASC, start_time ASC`,
                [req.user.id, targetDate]
            );

            const grouped = {};
            for (const row of rows) {
                const d = row.date instanceof Date ? row.date.toISOString().split("T")[0] : String(row.date).slice(0, 10);
                if (!grouped[d]) grouped[d] = [];
                grouped[d].push(row);
            }

            const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const timetable = Object.entries(grouped).map(([date, sessions]) => {
                const dayName = DAY_NAMES[new Date(date).getDay()];
                const totalStudyMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                return { date, day_name: dayName, total_study_minutes: totalStudyMinutes, sessions };
            });

            res.json({ timetable, weekly_summary: "Saved AI timetable loaded.", ai_tips: [] });
        } catch(e) {
            res.json({ timetable: [], weekly_summary: "", ai_tips: [] });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function assessDifficulty(req, res) {
    try {
        const userId = req.user.id;
        const [perf] = await db.execute(
            `SELECT AVG(quiz_score) as avg_score, COUNT(*) as sessions FROM progress
             WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
            [userId]
        );
        const [taskStats] = await db.execute(
            `SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed
             FROM tasks WHERE user_id = ?`,
            [userId]
        );
        const [flashStats] = await db.execute(
            "SELECT AVG(correct_count/NULLIF(times_reviewed,0)*100) as accuracy FROM flashcards WHERE user_id = ?",
            [userId]
        );
        const avgScore = parseFloat(perf[0]?.avg_score) || 0;
        const flashAccuracy = parseFloat(flashStats[0]?.accuracy) || 0;
        const completionRate = taskStats[0].total > 0 ? Math.round((taskStats[0].completed / taskStats[0].total) * 100) : 0;
        const composite = Math.round((avgScore * 0.5) + (flashAccuracy * 0.3) + (completionRate * 0.2));

        let level, label, color, next_level_at, suggestion;
        if (composite >= 80) {
            level = "advanced"; label = "Advanced"; color = "#4ae8a0"; next_level_at = null;
            suggestion = "Outstanding! Push yourself with harder materials and aim for 90%+ on quizzes.";
        } else if (composite >= 55) {
            level = "intermediate"; label = "Intermediate"; color = "#e8c84a"; next_level_at = 80;
            suggestion = "Solid progress! Review weak subjects daily and complete all flashcard sets.";
        } else {
            level = "beginner"; label = "Beginner"; color = "#4a8fe8"; next_level_at = 55;
            suggestion = "Great start! Consistency is everything — even 30 minutes daily makes a huge difference.";
        }

        try {
            await db.execute("UPDATE users SET difficulty_level = ? WHERE id = ?", [level, userId]);
        } catch(e) {}

        res.json({ level, label, color, scores: { quiz_average: Math.round(avgScore), flashcard_accuracy: Math.round(flashAccuracy), task_completion: completionRate, composite }, next_level_at, suggestion, sessions_tracked: perf[0]?.sessions || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function checkWorkload(req, res) {
    try {
        const userId = req.user.id;
        const [tasks] = await db.execute(
            `SELECT t.*, s.subject_name FROM tasks t LEFT JOIN subjects s ON t.subject_id = s.id
             WHERE t.user_id = ? AND t.status != 'completed' ORDER BY t.deadline ASC`,
            [userId]
        );
        if (tasks.length === 0) return res.json({ status: "balanced", message: "No pending tasks!", tasks: [] });

        const raw = await callAI(
            `You are a workload management AI. Analyse the task list and flag overload.
Return ONLY valid JSON:
{
  "status": "balanced|warning|overloaded",
  "total_estimated_hours": 24,
  "recommendation": "...",
  "heavy_subjects": ["..."],
  "daily_breakdown": [{ "date": "YYYY-MM-DD", "hours": 3.5, "tasks": ["title1"] }]
}`,
            `Tasks: ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, subject: t.subject_name, deadline: t.deadline, difficulty: t.difficulty, hours: t.estimated_hours })))}`,
            true
        );
        res.json(JSON.parse(raw));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function submitFeedback(req, res) {
    try {
        const { rating, comment, plan_type } = req.body;
        try {
            await db.execute(
                "INSERT INTO feedback (user_id, rating, comment, plan_type) VALUES (?, ?, ?, ?)",
                [req.user.id, rating, comment || null, plan_type || "general"]
            );
        } catch(e) {}
        res.json({ message: "Feedback received! Thank you 🙏" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function prioritizeTasks(req, res) {
    try {
        const userId = req.user.id;
        const [tasks] = await db.execute(
            `SELECT t.*, s.subject_name FROM tasks t LEFT JOIN subjects s ON t.subject_id = s.id
             WHERE t.user_id = ? AND t.status != 'completed'`,
            [userId]
        );
        if (tasks.length === 0) return res.json({ tasks: [], message: "No pending tasks" });

        const [perf] = await db.execute(
            "SELECT AVG(quiz_score) as avg FROM progress WHERE user_id = ? ORDER BY date DESC LIMIT 7",
            [userId]
        );
        const avgPerf = parseFloat(perf[0]?.avg) || 50;

        const scored = tasks.map(t => {
            const daysLeft = t.deadline ? Math.max(0, Math.ceil((new Date(t.deadline) - new Date()) / 86400000)) : 30;
            const diffScore = { easy: 20, medium: 50, hard: 80 }[t.difficulty] || 50;
            const urgency = daysLeft === 0 ? 100 : daysLeft <= 1 ? 90 : daysLeft <= 3 ? 75 : daysLeft <= 7 ? 55 : 30;
            const priority = Math.min(100, Math.round((urgency * 0.5) + (diffScore * 0.3) + ((t.estimated_hours || 2) * 2) + (avgPerf < 50 ? 10 : 0)));
            return { ...t, priority_score: priority, days_left: daysLeft };
        }).sort((a, b) => b.priority_score - a.priority_score);

        for (const t of scored) {
            await db.execute("UPDATE tasks SET priority_score = ? WHERE id = ?", [t.priority_score, t.id]);
        }

        res.json({ tasks: scored, ai_note: `Prioritized based on deadlines, difficulty, and your avg score of ${Math.round(avgPerf)}%` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function suggestWhatToStudyNext(req, res) {
    try {
        const userId = req.user.id;

        // Fetch all subjects with mastery scores
        const [subjects] = await db.execute(
            "SELECT id, subject_name, priority_level, mastery_score, color FROM subjects WHERE user_id = ? ORDER BY mastery_score ASC",
            [userId]
        );

        if (subjects.length === 0) {
            return res.json({
                suggestion: "Start by creating a subject to organize your studies.",
                action: "Create a subject",
                priority: "high",
                reason: "No subjects found"
            });
        }

        // Fetch pending tasks grouped by subject
        const [tasks] = await db.execute(
            `SELECT t.id, t.subject_id, t.title, t.difficulty, t.deadline, t.estimated_hours,
                    s.subject_name, s.mastery_score
             FROM tasks t
             LEFT JOIN subjects s ON t.subject_id = s.id
             WHERE t.user_id = ? AND t.status != 'completed'
             ORDER BY t.deadline ASC, t.difficulty DESC`,
            [userId]
        );

        // Fetch available study materials per subject
        const [materials] = await db.execute(
            `SELECT m.id, m.subject_id, m.title, m.file_type, m.status,
                    s.subject_name, COUNT(f.id) as flashcard_count
             FROM materials m
             LEFT JOIN subjects s ON m.subject_id = s.id
             LEFT JOIN flashcards f ON m.id = f.material_id
             WHERE m.user_id = ? AND m.status = 'ready'
             GROUP BY m.id
             ORDER BY m.subject_id, m.created_at DESC`,
            [userId]
        );

        // Fetch flashcard statistics per subject
        const [flashcardStats] = await db.execute(
            `SELECT s.id, s.subject_name,
                    COUNT(f.id) as total_cards,
                    SUM(CASE WHEN f.status = 'active' OR f.status IS NULL THEN 1 ELSE 0 END) as active_cards,
                    SUM(CASE WHEN f.times_reviewed = 0 THEN 1 ELSE 0 END) as unreviewed_cards,
                    ROUND(AVG(CASE WHEN f.times_reviewed > 0 THEN (f.correct_count / f.times_reviewed * 100) ELSE 0 END), 1) as accuracy
             FROM subjects s
             LEFT JOIN flashcards f ON s.id = f.subject_id AND f.user_id = ?
             WHERE s.user_id = ?
             GROUP BY s.id`,
            [userId, userId]
        );

        // Get today's date for deadline proximity calculation
        const today = new Date();
        const subjectAnalysis = subjects.map(subject => {
            const subjectTasks = tasks.filter(t => t.subject_id === subject.id);
            const subjectMaterials = materials.filter(m => m.subject_id === subject.id);
            const subjectFlashcards = flashcardStats.find(f => f.id === subject.id);
            
            let urgencyScore = 0;
            let urgencyReason = [];

            // Check task deadlines
            const urgentTask = subjectTasks.find(t => {
                if (!t.deadline) return false;
                const daysUntil = Math.ceil((new Date(t.deadline) - today) / 86400000);
                return daysUntil >= 0 && daysUntil <= 3;
            });
            if (urgentTask) {
                urgencyScore += 40;
                urgencyReason.push(`Task "${urgentTask.title}" due in 3 days or less`);
            }

            // Check if many tasks pending
            if (subjectTasks.length >= 3) {
                urgencyScore += 20;
                urgencyReason.push(`${subjectTasks.length} pending tasks`);
            }

            // Check low mastery
            if (subject.mastery_score < 40) {
                urgencyScore += 30;
                urgencyReason.push("Low mastery score - needs review");
            }

            // Check high priority subject
            if (subject.priority_level === 'high') {
                urgencyScore += 15;
                urgencyReason.push("High priority subject");
            }

            // Check for unreviewed flashcards
            if (subjectFlashcards && subjectFlashcards.unreviewed_cards > 0) {
                urgencyScore += 10;
                urgencyReason.push(`${subjectFlashcards.unreviewed_cards} unreviewed flashcards`);
            }

            return {
                id: subject.id,
                subject_name: subject.subject_name,
                priority_level: subject.priority_level,
                mastery_score: subject.mastery_score,
                color: subject.color,
                pending_tasks: subjectTasks.length,
                tasks: subjectTasks.slice(0, 2),
                available_materials: subjectMaterials.length,
                materials: subjectMaterials.slice(0, 2),
                flashcard_stats: subjectFlashcards,
                urgency_score: urgencyScore,
                urgency_reasons: urgencyReason
            };
        });

        // Sort by urgency score
        const rankedSubjects = subjectAnalysis.sort((a, b) => b.urgency_score - a.urgency_score);
        const topSubject = rankedSubjects[0];

        // Create AI prompt for intelligent suggestion
        const systemPrompt = `You are an AI study advisor. Based on a student's subject analysis, suggest exactly what they should study next. 
Be concise, actionable, and motivating. Return JSON with exactly this structure:
{
  "subject_name": "...",
  "what_to_do": "Specific action (e.g., 'Review flashcards on Chapter 3', 'Complete overview exercises', 'Read pages 45-67')",
  "why": "Brief reason (e.g., 'Deadline in 2 days' or 'Foundation concept with 40% mastery')",
  "estimated_time": "20 minutes|45 minutes|2 hours|etc",
  "difficulty_level": "easy|medium|hard",
  "next_after_this": "What to study after completing this (e.g., 'Answer practice quiz')",
  "motivation": "One encouraging sentence"
}`;

        const userPrompt = `Top subject analysis: ${JSON.stringify(topSubject, null, 2)}

All subjects: ${JSON.stringify(rankedSubjects, null, 2)}

Suggest what this student should study right now based on their urgency scores, deadlines, available materials, and mastery levels.`;

        const raw = await callAI(systemPrompt, userPrompt, true);
        const aiSuggestion = JSON.parse(raw);

        res.json({
            primary_suggestion: aiSuggestion,
            subject_analysis: topSubject,
            alternatives: rankedSubjects.slice(1, 3),
            all_subjects: rankedSubjects
        });
    } catch (error) {
        console.error("Study suggestion error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function generateStudyPlan(req, res) {
    try {
        const userId = req.user.id;
        const { subject_id, material_id, duration_days = 7, intensity = "balanced" } = req.body;

        if (!subject_id && !material_id) {
            return res.status(400).json({ message: "Provide subject_id or material_id" });
        }

        // Fetch subject info
        const [subjects] = await db.execute(
            "SELECT id, subject_name, priority_level, mastery_score FROM subjects WHERE user_id = ? AND id = ?",
            [userId, subject_id]
        );
        const subject = subjects[0];

        // Fetch material info if provided
        let material = null;
        if (material_id) {
            const [materials] = await db.execute(
                "SELECT id, title, extracted_text, file_type FROM materials WHERE user_id = ? AND id = ?",
                [userId, material_id]
            );
            material = materials[0];
        }

        // Get current performance
        const [perfData] = await db.execute(
            `SELECT AVG(quiz_score) as avg_score, COUNT(*) as total_quizzes 
             FROM progress WHERE user_id = ? AND subject_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
            [userId, subject_id]
        );

        const avgScore = parseFloat(perfData[0]?.avg_score) || 60;

        // Get material content snippet for context
        let materialContext = "";
        if (material && material.extracted_text) {
            const lines = material.extracted_text.split("\n").filter(l => l.trim());
            materialContext = lines.slice(0, 20).join("\n"); // First 20 lines
        }

        const systemPrompt = `You are an expert study plan creator. Generate a detailed, structured study plan in JSON format.
Return ONLY valid JSON (no markdown, no explanation):
{
  "plan": {
    "title": "string",
    "overview": "string",
    "total_hours": number,
    "difficulty_progression": "string",
    "daily_schedule": [
      {
        "day": number,
        "date": "YYYY-MM-DD",
        "topic": "string",
        "topics": ["string"],
        "duration_minutes": number,
        "materials": ["string"],
        "tasks": ["string"],
        "quiz_focus": "string",
        "difficulty_level": "easy|medium|hard"
      }
    ]
  }
}`;

        const userPrompt = `Create a ${duration_days}-day study plan for:
Subject: ${subject?.subject_name || "Study Material"}
Current Mastery: ${subject?.mastery_score || 50}%
Average Quiz Score: ${Math.round(avgScore)}%
Intensity Level: ${intensity}
${material ? `Material: ${material.title}\nContent Preview:\n${materialContext}` : ""}

${intensity === "intense" ? "Make this challenging with 3-4 hours daily study and advanced topics." : ""}
${intensity === "light" ? "Make this relaxed with 1-2 hours daily and foundational concepts." : ""}
${intensity === "balanced" ? "Balance difficulty with progressive learning." : ""}

Create a progressive plan that builds from basics to advanced, with daily milestones and specific study materials/resources.`;

        const raw = await callAI(systemPrompt, userPrompt, true);
        const planjson = JSON.parse(raw);

        // Add study plan to database if provided material_id
        if (material_id) {
            const planJson = JSON.stringify(planjson.plan);
            await db.execute(
                `UPDATE materials SET study_plan = ? WHERE id = ? AND user_id = ?`,
                [planJson, material_id, userId]
            ).catch(() => {}); // Plan save failure is non-critical
        }

        res.json(planjson.plan);
    } catch (error) {
        console.error("Study plan generation error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function suggestTopicsBasedOnPerformance(req, res) {
    try {
        const userId = req.user.id;

        // Get all subjects with performance data
        const [subjectPerf] = await db.execute(
            `SELECT s.id, s.subject_name, s.mastery_score, COUNT(t.id) as task_count,
                    SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END) as completed_tasks,
                    AVG(p.quiz_score) as avg_quiz_score
             FROM subjects s
             LEFT JOIN tasks t ON s.id = t.subject_id
             LEFT JOIN progress p ON s.id = p.subject_id AND p.user_id = ?
             WHERE s.user_id = ?
             GROUP BY s.id
             ORDER BY s.mastery_score ASC`,
            [userId, userId]
        );

        if (subjectPerf.length === 0) {
            return res.json({
                suggestions: [{
                    message: "Start by creating subjects to get personalized topic recommendations.",
                    action: "Create subjects in your dashboard"
                }]
            });
        }

        // Identify weak areas (mastery < 50%)
        const weakAreas = subjectPerf.filter(s => s.mastery_score < 50);
        const strongAreas = subjectPerf.filter(s => s.mastery_score >= 70);

        const systemPrompt = `You are an academic advisor. Analyze student performance and suggest specific topics to study.
Return JSON:
{
  "suggestions": [
    {
      "subject": "string",
      "weak_areas": ["string"],
      "recommended_topics": ["string"],
      "learning_path": "string",
      "estimated_hours": number,
      "resources": "string"
    }
  ]
}`;

        const userPrompt = `Student Performance Analysis:

Weak Areas (mastery < 50%):
${weakAreas.map(s => `- ${s.subject_name}: ${s.mastery_score}% mastery, ${s.task_count} tasks`).join("\n")}

Strong Areas (mastery >= 70%):
${strongAreas.map(s => `- ${s.subject_name}: ${s.mastery_score}% mastery`).join("\n")}

Based on performance gaps and weak areas, suggest:
1. Specific topics to focus on
2. Learning progression (what to study first)
3. Estimated study time needed
4. Resources to use (textbooks, videos, flashcards, etc.)`;

        const raw = await callAI(systemPrompt, userPrompt, true);
        const suggestions = JSON.parse(raw);

        res.json(suggestions);
    } catch (error) {
        console.error("Topic suggestion error:", error);
        res.status(500).json({ message: error.message });
    }
}

Object.assign(module.exports, {
    generateTimetable,
    getTimetable,
    assessDifficulty,
    checkWorkload,
    submitFeedback,
    prioritizeTasks,
    suggestWhatToStudyNext,
    generateStudyPlan,
    suggestTopicsBasedOnPerformance
});
