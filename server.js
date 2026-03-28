const app        = require("./server/app");
const { connectDB } = require("./server/config/db");
require("dotenv").config({ path: "./server/.env" });

const PORT = process.env.PORT || 5003;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 StudyAI Server running → http://localhost:${PORT}`);
      console.log(`\n📡 Auth endpoints:`);
      console.log(`   POST /api/auth/register`);
      console.log(`   POST /api/auth/login`);
      console.log(`   GET  /api/auth/me`);
      console.log(`   PUT  /api/auth/profile`);
      console.log(`   PUT  /api/auth/password`);
      console.log(`\n📚 Academic endpoints:`);
      console.log(`   GET/POST   /api/tasks`);
      console.log(`   PUT/DELETE /api/tasks/:id`);
      console.log(`   GET/POST   /api/subjects`);
      console.log(`   GET/POST   /api/calendar`);
      console.log(`\n🤖 AI endpoints:`);
      console.log(`   POST /api/ai/timetable/generate`);
      console.log(`   GET  /api/ai/timetable`);
      console.log(`   GET  /api/ai/difficulty`);
      console.log(`   GET  /api/ai/workload`);
      console.log(`   GET  /api/ai/prioritize`);
      console.log(`   POST /api/ai/flashcards/generate`);
      console.log(`   POST /api/ai/quiz/generate`);
      console.log(`   POST /api/ai/quiz/submit`);
      console.log(`   POST /api/ai/tutor/chat`);
      console.log(`   POST /api/ai/predict-exam`);
      console.log(`   GET  /api/ai/recommendations`);
      console.log(`   GET  /api/ai/progress`);
      console.log(`   POST /api/ai/calendar/generate\n`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
