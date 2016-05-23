var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clases jPack
var jPack = require('../jPack');

// Conección con Parse
var Parse = require('../parseConnect').Parse;

//Modelos
var User = require('../models/user');
var Tag = require('../models/tag');
var Action = require('../models/action');

var request = require('request');

router.post('/:action', ensureAuthenticated, function(req, res) {
	console.log('POST media ');
	if(req.body!=undefined && req.body!=''  && req.params.action!=undefined) {
		if (req.params.action=='new') {
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
		} else if (req.params.action=='shareActionOnFb') {
			Action.shareActionOnFb(req, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='reportAction') {
			Action.reportAction(req, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='save') {
			Action.saveAction(req.body, req.session.idMongoDb, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		} else if (req.params.action=='unsave') {
			Action.unsaveAction(req.body, req.session.idMongoDb, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
				res.status(400).end();
			});
		}
	}
});


module.exports = router;
