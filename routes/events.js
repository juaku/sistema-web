var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

var FB = require('fb');

// Clases jPack
var jPack = require('../jPack');

// Conección con Parse
var Parse = require('../parseConnect').Parse;

var request = require('request');

router.post('/', ensureAuthenticated, function(req, res) {
	//Crea eventos y los alamacena en la BD de Parse
	if(req.body!=undefined && req.body!='') {
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		jUser.createEvent(req, function(response) {
			res.status(201).end();
		}, function(error) {
			res.status(400).end();
			console.log(error);
		});
	} else {
		res.status(400).end();
	}
});

router.get('/', ensureAuthenticated, function(req, res) {
	if(req.query['source']=='fb') {
		// Devuelve todos los eventos de FB del usuario
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		jUser.getFbEvents(function(results) {
			res.json(results.data);
		});
	} else {
		// Devuelve todos los eventos de la BD
		jPack.getAllEvents(req, function(result) {
			res.json(result);
		}, function(error) {
			res.status(400).end();
		});
	}
});

module.exports = router;
