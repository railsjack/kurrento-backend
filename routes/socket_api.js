const express = require('express');

const router = express.Router();

router.get('/', function (req, res) {
    res.status(200).send("Received GET request at http://localhost:3000/collection");
});

module.exports = router;
