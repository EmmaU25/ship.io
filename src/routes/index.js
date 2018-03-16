const router = require('express').Router();

router.get('/', (req, res, next) => {
	res.render('index.ejs',{
		Title: "Dino.io"
	});
});

router.post('/goGame', (req,res,next) => {
	var user = req.body.user;
	console.log("user:", user);
	res.redirect('/game');
});

router.get('/game', (req,res,next) => {
	res.render('dino.ejs',{
		user: req.body.user
	});
});

module.exports = router;