var express = require('express');
var router = express.Router();

//Autenticación basada en JWT
var config = require('../config');
var expressJwt = require('express-jwt');
var ensureAuthenticated = expressJwt({secret : config.tokenSecret});

//Modelos
var User = require('../models/user');
var Tag = require('../models/tag');
var Action = require('../models/action');

router.post('/:action', ensureAuthenticated, function(req, res) {
	console.log('POST media ');
	if(req.body!=undefined && req.body!='' && req.params.action!=undefined) {
		if (req.params.action=='new') {
			var pathRegExp = new RegExp(/([0-9A-Za-z%]{3,})/g);
			var newTag = pathRegExp.exec(req.body.tag);
			if (newTag) {
				Tag.newAction(req, req.session.idMongoDb, function () {
					res.status(201).end();
				}, function(error) {
					console.log(error);
					res.status(400).end();
				});
			} else {
				console.log('TAG no permitido');
				res.status(400).end();
			}
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
		} else if (req.params.action=='editTag') {
			var pathRegExp = new RegExp(/([0-9A-Za-z%]{3,})/g);
			var newTag = pathRegExp.exec(req.body.tag);
			if(newTag) {
				Tag.editTag(req, req.session.idMongoDb, function () {
					res.status(201).end();
				}, function(error) {
					console.log(error);
					res.status(400).end();
				});
			} else {
				console.log('TAG no permitido');
				res.status(400).end();
			}
		} else if (req.params.action=='deleteAction') {
			Action.deleteAction(req.body, req.session.idMongoDb, function() {
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
