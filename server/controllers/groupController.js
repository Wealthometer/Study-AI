const { db } = require("../config/db");
const crypto = require("crypto");

function generateInviteCode() {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function createGroup(req, res) {
    try {
        const { name, description, subject, is_public, max_members } = req.body;
        if (!name) return res.status(400).json({ message: "Group name is required" });

        const inviteCode = generateInviteCode();
        const [result] = await db.execute(
            `INSERT INTO study_groups (name, description, subject, owner_id, invite_code, is_public, max_members)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description || null, subject || null, req.user.id, inviteCode, is_public || false, max_members || 10]
        );

        // Add owner as member
        await db.execute(
            "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'owner')",
            [result.insertId, req.user.id]
        );

        res.status(201).json({ message: "Group created", groupId: result.insertId, inviteCode });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function joinGroup(req, res) {
    try {
        const { invite_code } = req.body;
        const [groups] = await db.execute("SELECT * FROM study_groups WHERE invite_code = ?", [invite_code]);
        if (groups.length === 0) return res.status(404).json({ message: "Invalid invite code" });

        const group = groups[0];
        const [members] = await db.execute("SELECT COUNT(*) as count FROM group_members WHERE group_id = ?", [group.id]);
        if (members[0].count >= group.max_members) {
            return res.status(400).json({ message: "Group is full" });
        }

        const [existing] = await db.execute(
            "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
            [group.id, req.user.id]
        );
        if (existing.length > 0) return res.status(400).json({ message: "Already a member" });

        await db.execute("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", [group.id, req.user.id]);
        res.json({ message: "Joined group successfully", group });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getMyGroups(req, res) {
    try {
        const [groups] = await db.execute(
            `SELECT sg.*, u.name as owner_name,
             (SELECT COUNT(*) FROM group_members WHERE group_id = sg.id) as member_count,
             gm.role as my_role
             FROM study_groups sg
             JOIN group_members gm ON gm.group_id = sg.id AND gm.user_id = ?
             JOIN users u ON u.id = sg.owner_id
             ORDER BY sg.created_at DESC`,
            [req.user.id]
        );
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getGroupDetails(req, res) {
    try {
        const { id } = req.params;
        const [groups] = await db.execute("SELECT * FROM study_groups WHERE id = ?", [id]);
        if (groups.length === 0) return res.status(404).json({ message: "Group not found" });

        const [members] = await db.execute(
            `SELECT u.id, u.name, u.university, gm.role, gm.joined_at
             FROM group_members gm JOIN users u ON u.id = gm.user_id
             WHERE gm.group_id = ?`, [id]
        );

        const [discussions] = await db.execute(
            `SELECT d.*, u.name as author_name FROM group_discussions d
             JOIN users u ON u.id = d.user_id
             WHERE d.group_id = ? AND d.parent_id IS NULL
             ORDER BY d.created_at DESC LIMIT 20`, [id]
        );

        res.json({ group: groups[0], members, discussions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function postDiscussion(req, res) {
    try {
        const { content, parent_id } = req.body;
        const { id: group_id } = req.params;

        const [membership] = await db.execute(
            "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
            [group_id, req.user.id]
        );
        if (membership.length === 0) return res.status(403).json({ message: "Not a member of this group" });

        const [result] = await db.execute(
            "INSERT INTO group_discussions (group_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)",
            [group_id, req.user.id, content, parent_id || null]
        );

        res.status(201).json({ message: "Message posted", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function shareFlashcard(req, res) {
    try {
        const { flashcard_id } = req.body;
        const { id: group_id } = req.params;

        const [membership] = await db.execute(
            "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
            [group_id, req.user.id]
        );
        if (membership.length === 0) return res.status(403).json({ message: "Not a member" });

        await db.execute(
            "INSERT IGNORE INTO group_flashcards (group_id, flashcard_id, shared_by) VALUES (?, ?, ?)",
            [group_id, flashcard_id, req.user.id]
        );

        res.json({ message: "Flashcard shared with group" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { createGroup, joinGroup, getMyGroups, getGroupDetails, postDiscussion, shareFlashcard };
