var express = require('express');
var router = express.Router();
//Modelos
var User = require('../models/user');
var Tag = require('../models/tag');
var Action = require('../models/action');

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
	Action.getActions(req, function (actions) {
		jPack.showActions(req.session.idMongoDb, req.session.passport.user.accessToken, actions, function(posts) {
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

	if(path[0]) {
		req.session.path = path;
		if(path[1]) {
			if(path[2]) {
				User.getActionsByChannel(req, function(actions) {
					jPack.showActions(req.session.idMongoDb, req.session.passport.user.accessToken, actions, function(posts) {
						res.json(posts);
					});
				}, function(error) {
					console.log(error);
					res.status(404).end();
				});
			} else {
				User.getActionsByUser(req, function(actions) {
					jPack.showActions(req.session.idMongoDb, req.session.passport.user.accessToken, actions, function(posts) {
						res.json(posts);
					});
				}, function(error) {
					console.log(error);
					res.status(404).end();
				});
			}
		} else {
			if(path[2]) {
				Tag.getActionsByTag(req, function(actions) {
					jPack.showActions(req.session.idMongoDb, req.session.passport.user.accessToken, actions, function(posts) {
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

	/*if(req.params.action!=undefined) {
		if(req.params.action=='actions') {
			jPack.getAllPosts(req, function(result) {
				if(result.length == 0) {
			Action.getActions(req, function (actions, providerId, hexCode) {
				jPack.showActions(req.session.idMongoDb, req.session.passport.user.accessToken, actions, providerId, hexCode, function(posts) {
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
		} else if(req.params.action=='trend') {
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
		} else if(req.params.action=='tag') {
			console.log('list.js');
			Tag.getActionsByTag(req, function(actions, providerId, hexCode) {
				jPack.showActions(req.session.idMongoDb, req.session.passport.user.accessToken, actions, providerId, hexCode, function(posts) {
					res.json(posts);
				});
			}, function(error) {
				console.log(error);
				res.status(404).end();
			});
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
		} else if(req.params.action=='author') {
			User.getActionsByAuthor(req, function(actions, providerId, hexCode) {
				jPack.showActions(req.session.idMongoDb, req.session.passport.user.accessToken, actions, providerId, hexCode, function(posts) {
					res.json(posts);
				});
			}, function(error) {
				console.log(error);
				res.status(404).end();
			});
		} else if(req.params.action=='channel') {
			User.getActionsByChannel(req, function(actions, providerId, hexCode) {
				jPack.showActions(req.session.idMongoDb, req.session.passport.user.accessToken, actions, providerId, hexCode, function(posts) {
					res.json(posts);
				});
			}, function(error) {
				console.log(error);
				res.status(404).end();
			});
		}
	}*/
});

/*router.get('/:action/:id?/:i?', ensureAuthenticated, function(req, res) {
	console.log('Ingreso a enrutador avanzado')
	if(req.params.action!=undefined) {
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		//POST
		//if(req.params.filter=='post') {  //req.params.action puede ser: following, event, user, trend
			if(req.params.action=='event') {
				var Tag = mongoose.model('Tag');
				Tag.getActionsByTag(req, function(actions) {
					res.json(actions);
				}, function(error) {
					console.log(error);
					res.status(400).end();
				});
			} else if(req.params.action=='author') {
				var User = mongoose.model('User');
				User.getActionsByAuthor(req, function(actions) {
					res.json(actions);
				}, function(error) {
					console.log(error);
					res.status(400).end();
				});
			}
		//EVENT
		} else if (req.params.filter=='event') {
			if(req.params.action=='suggested') {
				jUser.getSuggestedEvents('', req, function(result) {
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
});*/

module.exports = router;
