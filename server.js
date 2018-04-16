const express = require('express');
const mongoose = require('mongoose');

const app = express();

const db = require('./config').mongoURI;

mongoose.connect(db)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error(err));

app.get('/', (req, res) => res.send('Sup bro!'));

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server listening on ${port}`);
});