var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clases jPack
var jPack = require('../jPack');

// Conección con Parse
var Parse = require('../parseConnect').Parse;

//Conección con Mongodb
var db = require('../mongodbConnect');

var request = require('request');

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
			var Tag = db.model('Tag');
			jPack.validateTagName(req.body, function(simpleEventName, mediaName, mediaExt) {
				Tag.newAction(req, simpleEventName, mediaName, mediaExt, req.session.idMongoDb, function () {
					res.status(201).end();
				}, function(error) {
					console.log(error);
					res.status(400).end();
				});
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='share') {
			var Action = db.model('Action');
			Action.shareActionOnFb(req, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='report') {
			jUser.report(req.body, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='getReportCount') {
			jPack.getReportCount(req.body, function() {
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
