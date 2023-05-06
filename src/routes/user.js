const express = require('express');
const HttpStatus = require('http-status-codes');
const router = express.Router();
const {db} = require('../db');


router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const queryText = 'SELECT * FROM users WHERE id = $1';
    const values = [id];

    try {
        const rows = await db.any(queryText, values); // Use db.any() instead of pool.query()

        if (rows.length === 0) {
            res.sendStatus(HttpStatus.NOT_FOUND);
        } else {
            res.status(HttpStatus.OK).json(rows[0]);
        }
    } catch (error) {
        res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
});


router.post('/', async (req, res) => {
    // Validate the data here
    const {
        first_name, last_name, phone_number, location_x, location_y,
        gender, relationship_status, interested_in
    } = req.body;

    if (!first_name || !last_name || !phone_number || !location_x || !location_y || !gender || !relationship_status || !interested_in) {
        return res.sendStatus(HttpStatus.BAD_REQUEST);
    }

    const queryText = `
        INSERT INTO users(first_name, last_name, phone_number, location_x, location_y,
          gender, relationship_status, interested_in)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
    `;

    const values = [
        first_name, last_name, phone_number, location_x, location_y,
        gender, relationship_status, interested_in
    ];

    try {
        const rows = await db.one(queryText, values);
        res.status(HttpStatus.CREATED).json({ id: rows.id });
    } catch (error) {
        if (error.code === '23505') { // Unique violation error
            res.sendStatus(HttpStatus.CONFLICT);
        } else {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
});


router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        first_name, last_name, phone_number, location_x, location_y,
        gender, relationship_status, interested_in, hobbies
    } = req.body;

    // Validate request data and prepare update fields
    const updateFields = [];
    const values = [id];

    if (first_name) {
        updateFields.push(`first_name = $${updateFields.length + 2}`);
        values.push(first_name);
    }

    if (last_name) {
        updateFields.push(`last_name = $${updateFields.length + 2}`);
        values.push(last_name);
    }

    if (phone_number) {
        updateFields.push(`phone_number = $${updateFields.length + 2}`);
        values.push(phone_number);
    }

    if (location_x) {
        updateFields.push(`location_x = $${updateFields.length + 2}`);
        values.push(location_x);
    }

    if (location_y) {
        updateFields.push(`location_y = $${updateFields.length + 2}`);
        values.push(location_y);
    }

    if (gender) {
        updateFields.push(`gender = $${updateFields.length + 2}`);
        values.push(gender);
    }

    if (relationship_status) {
        updateFields.push(`relationship_status = $${updateFields.length + 2}`);
        values.push(relationship_status);
    }

    if (interested_in) {
        updateFields.push(`interested_in = $${updateFields.length + 2}`);
        values.push(interested_in);
    }

    if (updateFields.length === 0 && !hobbies) {
        return res.sendStatus(HttpStatus.BAD_REQUEST);
    }

    // Begin transaction
    await db.tx(async t => {
        // Update user
        if (updateFields.length > 0) {
            const queryText = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING id;
      `;
            const rows = await t.any(queryText, values);

            if (rows.length === 0) {
                return res.sendStatus(HttpStatus.NOT_FOUND);
            }
        }

        // Update hobbies
        if (hobbies) {
            await t.none('DELETE FROM hobbies WHERE id = $1', [id]);

            const insertHobbiesQuery = `
                INSERT INTO hobbies (id, hobby)
                VALUES ${hobbies.map((_, i) => `($1, $${i + 2})`).join(', ')};
            `;
            await t.none(insertHobbiesQuery, [id, ...hobbies]);
        }

        res.sendStatus(HttpStatus.OK);
    }).catch(error => {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    });
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Begin transaction
    await db.tx(async t => {
        // Delete hobbies
        await t.none('DELETE FROM hobbies WHERE id = $1', [id]);

        // Delete friends
        await t.none('DELETE FROM friends WHERE id = $1 OR friend_id = $1', [id]);

        // Delete user
        const deleteResult = await t.result('DELETE FROM users WHERE id = $1', [id]);

        // Check if a user was deleted
        if (deleteResult.rowCount === 0) {
            res.sendStatus(HttpStatus.NOT_FOUND);
        } else {
            res.sendStatus(HttpStatus.OK);
        }
    }).catch(error => {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    });
});


module.exports = router;


