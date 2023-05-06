const express = require('express');
const HttpStatus = require('http-status-codes');
const router = express.Router();
const {db} = require('../db');



router.get('/:id/friends', async (req, res) => {
    const { id } = req.params;

    try {
        const userExists = await db.oneOrNone('SELECT id FROM users WHERE id = $1', [id]);

        if (!userExists) {
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        const friends = await db.any(`
            SELECT users.*
            FROM users
            JOIN friends ON users.id = friends.friend_id
            WHERE friends.id = $1;
        `, [id]);

        res.status(HttpStatus.OK).json(friends);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
});


router.post('/:id/friends', async (req, res) => {
    const { id } = req.params;
    const friendIds = req.body;

    if (!Array.isArray(friendIds)) {
        return res.sendStatus(HttpStatus.BAD_REQUEST);
    }

    if (friendIds.includes(id)) {
        return res.sendStatus(HttpStatus.BAD_REQUEST);
    }

    try {
        const userExists = await db.oneOrNone('SELECT id FROM users WHERE id = $1', [id]);

        if (!userExists) {
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        const allIdsExist = await Promise.all(
            friendIds.map(friendId => db.oneOrNone('SELECT id FROM users WHERE id = $1', [friendId]))
        );

        if (allIdsExist.some(user => !user)) {
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        const existingFriends = await db.any('SELECT friend_id FROM friends WHERE id = $1', [id]);

        for (const existingFriend of existingFriends) {
            if (friendIds.includes(existingFriend.friend_id)) {
                return res.sendStatus(HttpStatus.CONFLICT);
            }
        }

        await db.tx(async t => {
            for (const friendId of friendIds) {
                await t.none('INSERT INTO friends (id, friend_id) VALUES ($1, $2)', [id, friendId]);
            }
        });

        res.sendStatus(HttpStatus.CREATED);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
});


router.delete('/:id/friends', async (req, res) => {
    const { id } = req.params;
    const friendIds = req.body;

    if (!Array.isArray(friendIds)) {
        return res.sendStatus(HttpStatus.BAD_REQUEST);
    }

    try {
        const userExists = await db.oneOrNone('SELECT id FROM users WHERE id = $1', [id]);

        if (!userExists) {
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        await db.tx(async t => {
            for (const friendId of friendIds) {
                await t.none('DELETE FROM friends WHERE id = $1 AND friend_id = $2', [id, friendId]);
            }
        });

        res.sendStatus(HttpStatus.OK);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
});


module.exports = router;