const router = require('express').Router();

router.get('/', (req, res, next) => {
	res.render('index.ejs',{
		Title: "Dino.io"
	});
});

router.get('/goGame', (req,res,next) => {
	req.session.user = req.query.username;
	console.log("user:", req.session.user);
	res.redirect('/game');
});

router.get('/game', (req,res,next) => {
	res.render('dino.ejs',{
		user: req.session.user
	});
});
module.exports = router;