var express = require('express');
var router = express.Router();

//Autenticación basada en JWT
var config = require('../config');
var expressJwt = require('express-jwt');
var ensureAuthenticated = expressJwt({secret : config.tokenSecret});

//Modelos
var User = require('../models/user');
var Tag = require('../models/tag');
var Post = require('../models/action');

var jPack = require('../jPack');

router.post('/:action', ensureAuthenticated, function(req, res) {
	console.log('POST media ');
	if(req.body!=undefined && req.body!='' && req.params.action!=undefined) {
		if (req.params.action=='new') {
			jPack.checkTag(req.body.tag, function(simpleTag) {
				req.body.simpleTag = simpleTag;
				Tag.newPost(req, function (mediaName) {
					res.json(mediaName);
				}, function(error) {
					console.log(error);
					res.status(400).end();
				});
			}, function(e) {
				console.log('TAG no permitido');
				res.status(400).end();
			});
		} else if (req.params.action=='shareActionOnFb') {
			Post.sharePostOnFb(req, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='reportPost') {
			Post.reportPost(req, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='updateTag') {
			var pathRegExp = new RegExp(/(^[0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,})$/g);
			var newTag = pathRegExp.test(req.body.newTag); // false o true
			if(newTag) {
				Tag.updateTag(req, function () {
					res.status(201).end();
				}, function(error) {
					console.log(error);
					res.status(400).end();
				});
			} else {
				console.log('TAG no permitido');
				res.status(400).end();
			}
		} else if (req.params.action=='deletePost') {
			Post.deletePost(req, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='save') {
			Post.savePost(req, function(post) {
				var channel = req.session.hexCode + '.' + req.session.firstName + '@' + post.tag;
				post.channelTo = channel;
				res.json(post);
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='unsave') {
			Post.unsavePost(req, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		}
	}
});


module.exports = router;
