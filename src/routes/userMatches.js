const express = require('express');
const HttpStatus = require('http-status-codes');
const router = express.Router();
const {db} = require('../db');


router.get('/:id/matches', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', [id]);

        if (!user) {
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        const matches = await db.any(`
            WITH user_hobbies AS (
                SELECT hobby FROM hobbies WHERE id = $1
            ),
            potential_matches AS (
                SELECT u.*, COUNT(h.hobby) AS common_hobbies,
                  SQRT(POWER(u.location_x - $2, 2) + POWER(u.location_y - $3, 2)) AS distance
                FROM users u
                JOIN hobbies h ON u.id = h.id
                WHERE u.relationship_status = 'single' AND u.gender = $4 AND u.id != $1
                GROUP BY u.id
            )
            SELECT *,
                (common_hobbies - distance) AS score
            FROM potential_matches
            ORDER BY score DESC;
        `, [id, user.location_x, user.location_y, user.interested_in]);

        res.status(HttpStatus.OK).json(matches);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
});


module.exports = router;