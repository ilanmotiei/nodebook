const express = require('express');
const HttpStatus = require('http-status-codes');
const router = express.Router();
const {db} = require('../db');


router.delete('/', async (req, res) => {
    // Begin transaction
    await db.tx(async t => {
        // Delete hobbies
        await t.none('DELETE FROM hobbies');

        // Delete friends
        await t.none('DELETE FROM friends');

        // Delete users
        await t.none('DELETE FROM users');

        res.sendStatus(HttpStatus.OK);
    }).catch(error => {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    });
});


router.get('/', async (req, res) => {
    const {
        first_name, last_name, phone_number, location_x, location_y,
        gender, relationship_status, interested_in, hobbies
    } = req.query;

    if ((location_x && !location_y) || (!location_x && location_y)) {
        return res.sendStatus(HttpStatus.BAD_REQUEST);
    }

    const whereClauses = [];
    const values = [];

    if (first_name) {
        whereClauses.push(`first_name = $${whereClauses.length + 1}`);
        values.push(first_name);
    }

    if (last_name) {
        whereClauses.push(`last_name = $${whereClauses.length + 1}`);
        values.push(last_name);
    }

    if (phone_number) {
        whereClauses.push(`phone_number = $${whereClauses.length + 1}`);
        values.push(phone_number);
    }

    if (location_x && location_y) {
        whereClauses.push(`location_x = $${whereClauses.length + 1} AND location_y = $${whereClauses.length + 2}`);
        values.push(location_x, location_y);
    }

    if (gender) {
        whereClauses.push(`gender = $${whereClauses.length + 1}`);
        values.push(gender);
    }

    if (relationship_status) {
        whereClauses.push(`relationship_status = $${whereClauses.length + 1}`);
        values.push(relationship_status);
    }

    if (interested_in) {
        whereClauses.push(`interested_in = $${whereClauses.length + 1}`);
        values.push(interested_in);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryText = `
    SELECT * FROM users
    ${whereClause};
  `;

    try {
        const users = await db.any(queryText, values);

        if (hobbies) {
            const hobbiesArray = JSON.parse(hobbies);
            if (!Array.isArray(hobbiesArray)) {
                return res.sendStatus(HttpStatus.BAD_REQUEST);
            }

            const filteredUsers = [];

            for (const user of users) {
                const userHobbies = await db.any('SELECT hobby FROM hobbies WHERE id = $1', [user.id]);

                const hasAllHobbies = hobbiesArray.every(hobby => userHobbies.some(userHobby => userHobby.hobby === hobby));

                if (hasAllHobbies) {
                    filteredUsers.push(user);
                }
            }

            res.status(HttpStatus.OK).json(filteredUsers);
        } else {
            res.status(HttpStatus.OK).json(users);
        }
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
});


module.exports = router;
