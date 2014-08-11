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
	var eventType = req.body.type;
	if(req.body!=undefined && req.body!='') {
		if(true) { 
			req.session.jUser = new jPack.user(req.session.jUser);
			var jUser = req.session.jUser;
			jUser.createEvent(eventType, req, function(response) {
				res.status(201).end();
			}, function(error) {
				console.log(error);
			});
		} else {
			var jEvent = new jPack.event ({
				id : req.body.id,
				name : req.body.name,
				//description : req.body.description ,
				startTime : req.body.startTime,
				endTime : req.body.endTime,
				//assistantNumber : ?,
				//cover : req.body.cover.source,
				location : req.body.location,
				timezone : req.body.timezone 
			});

			jEvent.setIdFbEvent(eventType, function() {
				res.status(201).end();
			}, function(error) {
				console.log(error);
			});
		}
	} else {
		res.status(400).end();
	}
});

router.get('/', ensureAuthenticated, function(req, res) {
	var accessToken = req.session.passport.user.accessToken;
	if(req.query['source']=='fb') {
		// Devuelve todos los eventos de FB del usuario
		req.session.jUser = new jPack.user(req.session.jUser);
		var jUser = req.session.jUser;
		jUser.getFbEvents(accessToken, function(results) {
			res.json(results.data);
		});
	} else {
		// Devuelve todos los eventos de la BD
		var Events = Parse.Object.extend("Events");
		var query = new Parse.Query(Events);
		var events = [];
		query.find().then(function(results) {
			var jUser = new jPack.user(req.session.jUser);
			jUser.getAttendance(function(response) {
				for(i in results) {
					events[i] = {};
					events[i].name = results[i].get('name');
					events[i].attendance = findIfAttended(results[i].id, response);
				};
				res.json(events);
			});
		});

		function findIfAttended(eventId, eventsAttended) {
			for(i in eventsAttended) {
				if(eventsAttended[i].id == eventId)
					return true;
			}
			return false;
		}
	}
});

module.exports = router;
