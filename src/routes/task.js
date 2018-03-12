const router = require('express').Router();
const request = require('request');

router.get('/randomUser',(req, res) => {
	request('https://randomuser.me/api/?inc=login,picture', function(error, response, body) {
        res.json( body);   
    });
});

module.exports = router;