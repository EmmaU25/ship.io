const router = require('express').Router();
const request = require('request');

router.get('/randomUser',(req, res) => {
	request.get('https://randomuser.me/api/?inc=login,picture',{json: true} ,function(error, response, body) {
        res.send(body);
    });
});
module.exports = router;