const express = require('express');
const bodyParser = require('body-parser');
const userRouter = require('./routes/user');
const userFriendsRoutes = require('./routes/userFriends');
const userSuggestionsRoutes = require('./routes/userSuggestions');
const userMatchesRoutes = require('./routes/userMatches');
const usersRouter = require('./routes/users');
const {initializeDatabase} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/api/user', userRouter);
app.use('/api/user', userFriendsRoutes);
app.use('/api/user', userSuggestionsRoutes);
app.use('/api/user', userMatchesRoutes);
app.use('/api/users', usersRouter);

initializeDatabase();

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});

