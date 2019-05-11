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

// TODO: Método createMapping se ejecuta una sola vez y debe ser llamado manualmente abre un 'mongoose stream' e inicia la indexación de documentos individualmente.
// El Mapping es el proceso de definir cómo un documento y los campos que contiene se almacenan e indexan.
/*Post.createMapping(function(err, mapping){
	if(err) {
		console.log('error creating mapping');
		console.log(err);
	} else {
		console.log('Mapping created');
		console.log(mapping);
	}
});*/
/*Tag.createMapping({
	"settings": {
		"analysis": {
			"filter": {
				"autocomplete_filter": {
					"type": "edge_ngram",
					"min_gram": 1,
					"max_gram": 20
				}
			},
			"analyzer": {
				"autocomplete": {
					"type": "custom",
					"tokenizer": "standard",
					"filter": [
						"lowercase",
						"autocomplete_filter"
					]
				}
			}
		}
	}
}, function(err, mapping){
	if(err) {
		console.log('error creating mapping');
		console.log(err);
	} else {
		console.log('Mapping created');
		console.log(mapping);
	}
});*/

// TODO: Método synchronize abre un 'mongoose stream' e inicia la indexación de documentos individualmente.
/*var stream = Post.synchronize();
var count = 0;

stream.on('data', function() {
	count++;
});

stream.on('close', function() {
	console.log('Indexed ' + count + ' documents!!!');
});

stream.on('error', function(err) {
	console.log(err);
});*/


/* GET router para '/account'
 * Autentica al usuario y carga la vista 'account.jade'
 */
router.get('/:i([0-9]+)?', function(req, res) {
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
							{
								"bool" : {
									"must" : {
										"match_all": {}
									}
								}
							},
							{
								"bool" : {
									"filter" : {
										"bool" : {
											"must_not" : {
												"nested" : {
													"path" : "reportedBy",
													"score_mode" : "avg",
													"query" : {
														"bool" : {
															"must" : {
																"term" : { "reportedBy._id" : req.session.idMongoDb }
															}
														}
													}
												}
											}
										}
									}
								}
							}
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
		if(results != undefined) {
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
		} else {
			console.log('elasticsearch no habilitado');
		}
	});
});

router.get('/:media([p\/0-9a-fA-F]+)', ensureAuthenticated, function(req, res) {
	var media = req.params.media.split('/');
	var postId = media[1];
	Post.esSearch({
		query: {
			"bool": {
				"must": [
					{ "match": { "_id": postId }}
				],
				"filter": [
					{ "term":  { "active": true }}
				]
			}
		}
	}, function(err, results){
		if(err) {
			console.log(err);
			res.status(400).end();
		}
		var post = results.hits.hits.map(function(hit){
			return hit;
		});
		jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, post, function(post) {
			if(post.length == 0) {
				res.status(204).end();
			} else {
				res.json(post);
			}
		});
	});
});

router.get('/search/q/:word', ensureAuthenticated, function(req, res) {
	var tag = req.params.word.split('@')[1];
	Tag.esSearch({
		from : 0,
		size : 3,
		query: {
			"match": {
				"tag": tag
			}
		},
	}, function(err, results){
		if(err) {
			console.log(err);
			res.status(400).end();
		}
		var suggestedTags = results.hits.hits.map(function(hit){
			return hit._source.tag;
		});
		if(suggestedTags.length > 0) {
			res.json(suggestedTags);
		} else {
			res.status(202).end();
		}
	});
});

router.get('/:pathname?/:i([0-9]+)?', ensureAuthenticated, function(req, res) {
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
			User.getPostsByUser(req, function(posts) {
				jPack.showPosts(req.session.idMongoDb, req.session.passport.user.accessToken, posts, function(posts) {
					res.json(posts);
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
										{
											"bool": {
												"must": [
													{ "match": { "tagId":  tag._id }}
												],
												"filter": [
													{ "term":  { "active": true }}
												]
											}
										},
										{
											"bool" : {
												"filter" : {
													"bool" : {
														"must_not" : {
															"nested" : {
																"path" : "reportedBy",
																"score_mode" : "avg",
																"query" : {
																	"bool" : {
																		"must" : {
																			"term" : { "reportedBy._id" : req.session.idMongoDb }
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
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
