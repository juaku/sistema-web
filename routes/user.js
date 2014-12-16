var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clases jPack
var jPack = require('../jPack');

router.get('/', ensureAuthenticated, function(req, res) {
	req.session.jUser = new jPack.user(req.session.jUser);
	var jUser = req.session.jUser;
	jUser.showFriendsUsingApp(req, function(usingIds) {
		res.json(usingIds);
	}, function(error) {
		res.status(400).end();
	});
});

router.post('/', ensureAuthenticated, function(req, res) {
	if(req.body!=undefined && req.body!='') {
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		jUser.setNewFollowRelation(req.body, function() {
			res.status(201).end();
		}, function(error) {
			res.status(400).end();
			console.log(error);
		});
	}
});

module.exports = router;

