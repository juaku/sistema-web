var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clases jPack
var jPack = require('../jPack');

router.get('/:action', ensureAuthenticated, function(req, res) {
	if(req.params.action!=undefined) {
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		if(req.params.action=='getAllUsers') {
			jUser.getAllUsers(req, function(allUsers) {
				res.json(allUsers);
			}, function(error) {
				res.status(400).end();
			});
		} else if (req.params.action=='getFollowers') {
			jUser.getFollowers(req, function(followers) {
				res.json(followers);
			}, function(error) {
				res.status(400).end();
				console.log(error);
			});
		} else if (req.params.action=='getFollowing') {
			jUser.getFollowing(req, function(following) {
				res.json(following);
			}, function(error) {
				res.status(400).end();
				console.log(error);
			});
		}
	}
});

router.post('/:action', ensureAuthenticated, function(req, res) {
	if(req.body!=undefined && req.body!='' && req.params.action!=undefined) {
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		if(req.params.action=='getGeo') {
			jUser.setGenericData(req, function() {
				res.status(201).end();
			}, function(error) {
				res.status(400).end();
				console.log(error);
			});
		} else if (req.params.action=='follow') {
			jUser.setFollowRelation(req.body.userToFollow, function() {
				res.status(201).end();
			}, function(error) {
				res.status(400).end();
				console.log(error);
			});
		} else if (req.params.action=='unfollow') {
			jUser.setUnFollowRelation(req.body.userToFollow, function() {
				res.status(201).end();
			}, function(error) {
				res.status(400).end();
				console.log(error);
			});
		}
	}
});

module.exports = router;

