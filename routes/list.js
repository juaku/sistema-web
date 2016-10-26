var express = require('express');
var router = express.Router();
//Modelos
var User = require('../models/user');
var Tag = require('../models/tag');
var Post = require('../models/action');

//Autenticación basada en JWT
var config = require('../config');
var expressJwt = require('express-jwt');
var ensureAuthenticated = expressJwt({secret : config.tokenSecret});

// Clases jPack
var jPack = require('../jPack');

/* GET router para '/account'
 * Autentica al usuario y carga la vista 'account.jade'
 */
router.get('/:i([0-9]+)?', ensureAuthenticated, function(req, res) {
	if(req.session.coords == undefined) { // Arequipa
		req.session.coords = {};
		req.session.coords.latitude = -16.3989;
		req.session.coords.longitude = -71.535;
	}
	Post.getPosts(req, function (posts) {
		jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
			if(posts.length == 0) {
				res.status(204).end();
			} else {
				res.json(posts);
			}
		});
	}, function(error) {
		console.log(error);
		res.status(400).end();
	});
});

router.get('/:pathname?/:i?', ensureAuthenticated, function(req, res) {
	var pathRegExp = new RegExp(/^((?:[0-9A-Fa-f]{3})\.(?:[A-Za-z%]{3,}))?(?:@([0-9A-Za-z%]{3,}))?$|^([0-9A-Za-z%]{3,})$/g);
	var path = pathRegExp.exec(req.params.pathname);
	if(req.session.coords == undefined) { // Arequipa
		req.session.coords = {};
		req.session.coords.latitude = -16.3989;
		req.session.coords.longitude = -71.535;
	}
	if(path[0]) {
		req.session.path = path;
		if(path[1]) {
			if(path[2]) {
				User.getPostsByChannel(req, function(posts) {
					jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
						res.json(posts);
					});
				}, function(error) {
					console.log(error);
					res.status(404).end();
				});
			} else {
				User.getPostsByUser(req, function(posts) {
					jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
						res.json(posts);
					});
				}, function(error) {
					console.log(error);
					res.status(404).end();
				});
			}
		} else {
			if(path[2]) {
				Tag.getPostsByTag(req, function(posts) {
					jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
						res.json(posts);
					});
				}, function(error) {
					console.log(error);
					res.status(404).end();
				});
			} else if(path[3]) {
				console.log('Tag');
			}
		}
	}
});

module.exports = router;
