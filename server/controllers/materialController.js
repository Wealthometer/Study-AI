const { db } = require("../config/db");
const path = require("path");
const fs = require("fs");

// Safely import optional heavy libraries
let pdfParse, Tesseract;
try { pdfParse = require("pdf-parse"); } catch(e) { console.warn("pdf-parse not installed"); }
try { Tesseract = require("tesseract.js"); } catch(e) { console.warn("tesseract.js not installed"); }

// Upload and process a material file
async function uploadMaterial(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { title, subject_id, file_type } = req.body;
        const userId = req.user.id;
        const filePath = req.file.path;
        const fileSize = req.file.size;
        const detectedType = detectFileType(req.file.mimetype);

        // Insert material record immediately
        const [result] = await db.execute(
            `INSERT INTO materials (user_id, subject_id, title, file_type, file_path, file_size, status)
             VALUES (?, ?, ?, ?, ?, ?, 'processing')`,
            [userId, subject_id || null, title || req.file.originalname, detectedType, filePath, fileSize]
        );
        const materialId = result.insertId;

        // Process asynchronously
        processFile(materialId, filePath, detectedType, req.file.mimetype);

        res.status(201).json({
            message: "Material uploaded. Processing in background...",
            materialId,
            status: "processing"
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: error.message });
    }
}

async function processFile(materialId, filePath, fileType, mimetype) {
    try {
        let extractedText = "";

        if (fileType === "pdf" && pdfParse) {
            const buffer = fs.readFileSync(filePath);
            const data = await pdfParse(buffer);
            extractedText = data.text;
        } else if (fileType === "image" && Tesseract) {
            const { data: { text } } = await Tesseract.recognize(filePath, "eng");
            extractedText = text;
        } else if (fileType === "text") {
            extractedText = fs.readFileSync(filePath, "utf8");
        }
        // Audio/Video: would use Whisper here in production

        await db.execute(
            "UPDATE materials SET extracted_text = ?, status = 'ready' WHERE id = ?",
            [extractedText.trim(), materialId]
        );
        console.log(`✅ Material ${materialId} processed successfully`);
    } catch (error) {
        console.error(`❌ Processing failed for material ${materialId}:`, error);
        await db.execute("UPDATE materials SET status = 'failed' WHERE id = ?", [materialId]);
    }
}

// Add YouTube link
async function addYoutubeLink(req, res) {
    try {
        const { title, youtube_url, subject_id } = req.body;
        if (!youtube_url) return res.status(400).json({ message: "YouTube URL is required" });

        const [result] = await db.execute(
            `INSERT INTO materials (user_id, subject_id, title, file_type, youtube_url, status)
             VALUES (?, ?, ?, 'youtube', ?, 'ready')`,
            [req.user.id, subject_id || null, title || "YouTube Video", youtube_url]
        );

        res.status(201).json({ message: "YouTube link added", materialId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getMaterials(req, res) {
    try {
        const [rows] = await db.execute(
            `SELECT m.*, s.subject_name FROM materials m
             LEFT JOIN subjects s ON m.subject_id = s.id
             WHERE m.user_id = ?
             ORDER BY m.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getMaterial(req, res) {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM materials WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: "Material not found" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteMaterial(req, res) {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM materials WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: "Material not found" });

        // Delete file from disk
        if (rows[0].file_path && fs.existsSync(rows[0].file_path)) {
            fs.unlinkSync(rows[0].file_path);
        }

        await db.execute("DELETE FROM materials WHERE id = ?", [req.params.id]);
        res.json({ message: "Material deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

function detectFileType(mimetype) {
    if (mimetype === "application/pdf") return "pdf";
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.startsWith("audio/")) return "audio";
    if (mimetype.startsWith("video/")) return "video";
    if (mimetype === "text/plain") return "text";
    return "text";
}

module.exports = { uploadMaterial, addYoutubeLink, getMaterials, getMaterial, deleteMaterial };
