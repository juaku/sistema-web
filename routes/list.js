var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clases jPack
var jPack = require('../jPack');

/* GET router para '/account'
 * Autentica al usuario y carga la vista 'account.jade'
 */

router.get('/:filter/:i?', ensureAuthenticated, function(req, res) {
	if(req.params.filter!=undefined) {
		if(req.params.filter=='post') {
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
		} else if(req.params.filter=='trend') {
			jPack.getTrends(req, function(result) {
				if(result.length == 0) {
					res.status(204).end();
				} else {
					res.json(result);
				}
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if(req.params.filter=='event') {
			jPack.getAllEvents(req, function(result) {
				if(result.length == 0) {
					res.status(204).end();
				} else {
					res.json(result);
				}
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		}
	}
});

router.get('/:filter/:action/:id?/:i?', ensureAuthenticated, function(req, res) {
	if(req.params.filter!=undefined && req.params.action!=undefined) {
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		//POST
		if(req.params.filter=='post') {  //req.params.action puede ser: following, event, user, trend
			jPack.getAllPosts(req, function(result) {
				res.json(result);
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		//EVENT
		} else if (req.params.filter=='event') {
			if(req.params.action=='suggested') {
				jPack.getMediaSuggested(req, function(result) {
					res.json(result);
				}, function(error) {
					console.log(error);
					res.status(400).end();
				});
			}
		//USER
		} else if (req.params.filter=='user') {
			if(req.params.action=='followers') {
				jUser.getFollowers(req, function(followers) {
					res.json(followers);
				}, function(error) {
					res.status(400).end();
					console.log(error);
				});
			} else if (req.params.action=='following') {
				jUser.getFollowing(req, function(following) {
					res.json(following);
				}, function(error) {
					res.status(400).end();
					console.log(error);
				});
			}
		}
	}
});


module.exports = router;
