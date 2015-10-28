var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clases jPack
var jPack = require('../jPack');

// Conección con Parse
var Parse = require('../parseConnect').Parse;

var request = require('request');
// TODO: Ver si :action sirve
// router.get('/:action/:filter/:id?/:postQueryCount?', ensureAuthenticated, function(req, res) {
router.get('/:filter/:id?/:postQueryCount?', ensureAuthenticated, function(req, res) {
	console.log('GET media');
	jPack.getAllPosts(req, function(result) {
		if(result.length == 0) {
			res.status(204).end();
		} else {
			res.json(result);
		}
	}, function(error) {
		console.log(error);
		res.status(400).end();
	});
});

router.post('/:action', ensureAuthenticated, function(req, res) {
	console.log('POST media');
	if(req.body!=undefined && req.body!=''  && req.params.action!=undefined) {
		console.log('H1');
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		if(req.params.action=='like') {
			jUser.setLike(req.body, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='unlike') {
			jUser.setUnlike(req.body, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='new') {
			jUser.newPost(req, req.body, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		}
		console.log('H2');

	}
});


module.exports = router;
