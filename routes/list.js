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
	var resultsLimit = 20;
	var queryNumber = 0;
	if(req.params.i!=undefined) {
		queryNumber = parseInt(req.params.i);
	}
	Post.esSearch({
		from : resultsLimit * queryNumber,
		size : resultsLimit,
		query: {
			"function_score": {
				"query": {
					"bool": {
						"must": [
							{ "match_all": {} }
						],
						"filter": [
							{ "term":  { "active": true }}
						]
					}
				},
				"functions": [
					{
						"gauss": {
							"geo": {
								"origin": req.session.coords.longitude + ',' + req.session.coords.latitude,// "-71.536742,-16.398735",
								"offset": "1km",
								"scale":  "2km"
							}
						}
					},
					{
						"gauss": {
							"createdAt": {
								"origin": "2017-07-28T00:00:00.000z",
								"scale": "10d",
								"offset": "5d",
								"decay" : 0.5
							}
						},
						"weight": 2
					}
				]
			}
		},
	},
	{
		"sort": ["_score"]
	}, function(err, results){
		if(err) {
			console.log(err);
			res.status(400).end();
		}
		var posts = results.hits.hits.map(function(hit){
			return hit;
		});
		jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
			if(posts.length == 0) {
				res.status(204).end();
			} else {
				res.json(posts);
			}
		});
	});
});

router.get('/:pathname?/:i?', ensureAuthenticated, function(req, res) {
	if(req.session.coords == undefined) { // Arequipa
		req.session.coords = {};
		req.session.coords.latitude = -16.3989;
		req.session.coords.longitude = -71.535;
	}
	jPack.validateName(req.params.pathname, function(pathSimple, type) {
		req.session.path = pathSimple;
		var resultsLimit = 20;
		var queryNumber = 0;
		if(req.params.i!=undefined) {
			queryNumber = parseInt(req.params.i);
		}
		if(type == 'channel') {
			User.getPostsByChannel(req, function(posts) {
				jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
					res.json(posts);
				});
			}, function(error) {
				console.log(error);
				res.status(404).end();
			});
		} else if(type == 'user') {
			User.getUserId(req, function(user) {
				Post.esSearch({
					from : resultsLimit * queryNumber,
					size : resultsLimit,
					query: {
						"function_score": {
							"query": {
								"bool": {
									"must": [
										{ "match": { "authorId":  user._id }}
									],
									"filter": [
										{ "term":  { "active": true }}
									]
								}
							},
							"functions": [
								{
									"gauss": {
										"geo": {
											"origin": req.session.coords.longitude + ',' + req.session.coords.latitude,// "-71.536742,-16.398735",
											"offset": "1km",
											"scale":  "2km"
										}
									}
								},
								{
									"gauss": {
										"createdAt": {
											"origin": "2017-07-28T00:00:00.000z",
											"scale": "10d",
											"offset": "5d",
											"decay" : 0.5
										}
									},
									"weight": 2
								}
							]
						}
					}
				}, function(err, results){
					if(err) {
						console.log(err);
						res.status(400).end();
					}
					var posts = results.hits.hits.map(function(hit){
						return hit;
					});
					jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
						if(posts.length == 0) {
							res.status(204).end();
						} else {
							res.json(posts);
						}
					});
				});
			}, function(error) {
				console.log(error);
				res.status(404).end();
			});
		} else if(type == 'tag') {
			Tag.getTagId(req, function(tag) {
				Post.esSearch({
					from : resultsLimit * queryNumber,
					size : resultsLimit,
					query: {
						"function_score": {
							"query": {
								"bool": {
									"must": [
										{ "match": { "tagId":  tag._id }}
									],
									"filter": [
										{ "term":  { "active": true }}
									]
								}
							},
							"functions": [
								{
									"gauss": {
										"geo": {
											"origin": req.session.coords.longitude + ',' + req.session.coords.latitude,// "-71.536742,-16.398735",
											"offset": "1km",
											"scale":  "2km"
										}
									}
								},
								{
									"gauss": {
										"createdAt": {
											"origin": "2017-07-28T00:00:00.000z",
											"scale": "10d",
											"offset": "5d",
											"decay" : 0.5
										}
									},
									"weight": 2
								}
							]
						}
					}
				}, function(err, results){
					if(err) {
						console.log(err);
						res.status(400).end();
					}
					var posts = results.hits.hits.map(function(hit){
						return hit;
					});
					console.log('TAG posts.length: ' + posts.length);
					jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
						if(posts.length == 0) {
							res.status(204).end();
						} else {
							res.json(posts);
						}
					});
				});
			}, function(error) {
				console.log(error);
				res.status(404).end();
			});
		}
	}, function(e) {
		console.log('URL no permitida');
		res.status(400).end();
	});
});

module.exports = router;
