CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL UNIQUE,
    location_x REAL NOT NULL,
    location_y REAL NOT NULL,
    gender VARCHAR(255) NOT NULL,
    relationship_status VARCHAR(255) NOT NULL,
    interested_in VARCHAR(255) NOT NULL
);
