var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clases jPack
var jPack = require('../jPack');

// Conección con Parse
var Parse = require('../parseConnect').Parse;

var request = require('request');

router.get('/:postQueryCount?', ensureAuthenticated, function(req, res) {
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

router.post('/', ensureAuthenticated, function(req, res) {
	if(req.body!=undefined && req.body!='') {
		console.log('H1');
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		console.log('H2');
		jUser.newPost(req.body, function() {
			res.status(201).end();
		}, function(error) {
			console.log(error);
			res.status(400).end();
		});
	}
});


module.exports = router;
