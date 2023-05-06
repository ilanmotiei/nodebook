const pgp = require('pg-promise')();
const config = require('./config');
const fs = require('fs');
const path = require('path');

const db = pgp(config.dbConnectionString);

async function initializeDatabase() {
    try {
        const schemasPath = path.join(__dirname, config.schemasDir);
        const schemaFiles = fs.readdirSync(schemasPath);

        for (const file of schemaFiles) {
            if (path.extname(file) === '.sql') {
                const schema = fs.readFileSync(path.join(schemasPath, file)).toString();
                await db.none(schema);
            }
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing the database:', error);
    }
}

module.exports = {
    db,
    initializeDatabase
};