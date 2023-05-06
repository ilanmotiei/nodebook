const express = require('express');
const HttpStatus = require('http-status-codes');
const router = express.Router();
const {db} = require('../db');


router.get('/:id/suggestions', async (req, res) => {
    const { id } = req.params;

    try {
        const userExists = await db.oneOrNone('SELECT id FROM users WHERE id = $1', [id]);

        if (!userExists) {
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        const suggestions = await db.any(`
            SELECT DISTINCT u.*
            FROM users u
            JOIN friends f1 ON u.id = f1.friend_id
            JOIN friends f2 ON f1.id = f2.friend_id
            WHERE f2.id = $1 AND u.id != $1 AND u.id NOT IN (
                SELECT friend_id FROM friends WHERE id = $1
            );
        `, [id]);

        res.status(HttpStatus.OK).json(suggestions);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
});


module.exports = router;