var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

var FB = require('fb');
//TODO: Cambiar este token por uno del usuario actual.
var accessToken = "CAAD9Q8hVF7gBAF7B8DxI63KkofOTKZCw6x4VhCAxHkpYnCXA8GwHo7MAV944Oqqkn8bLn05tNR7XVpGaY2erHPL3m1NyoeNT7ZCbl33a5CXLx1mvtb2Clnsqqel83Wn7lmQBFaS75OWspUhowB6sm4BLKHshqqrInEETEiMmuXoQru0vf4wcmQKNnge04bagOcBC7bOhMYKvPU1NP3pzL76tqb7wkZD";

//Clases jPack
var jPack = require('../jPack');

//Concección con Parse
var Parse = require('../parseConnect').Parse;

router.get('/', ensureAuthenticated, function(req, res) {
	//TODO: Pasar esto a jPack
	var Eventos = Parse.Object.extend("Eventos");
	
	//Exportación del evento de Facebook
	FB.api('me/events/created',{ access_token: accessToken }, function(res){
		if(!res || res.error) {
			console.log(res.error);
			return;
		}
		var id = res.data[0].id;
		var name = res.data[0].name;
		var startTime = res.data[0].start_time;
		var endTime = res.data[0].end_time;
		var location = res.data[0].location;

		FB.api('fql', { q: [
			'SELECT description FROM event WHERE eid ='+res.data[0].id,
			'SELECT attending_count FROM event WHERE eid ='+res.data[0].id
			], access_token: accessToken }, function (res) {
				if(!res || res.error) {
					console.log(res.error);
					return;
				}
				req.session.jEvent = new jPack.event ({
					id : id,
					name : name,
					description :res.data[0].fql_result_set[0].description ,
					startTime : startTime,
					endTime : endTime,
					assistantNumber : res.data[1].fql_result_set[0].attending_count ,
                //      cover :,
                location : location
              });
				var jEvent = req.session.jEvent;
				console.log('PRUEBA: ');
				console.log(jEvent.prueba());


			});

	});


	if(req.query['evento']!=undefined && req.query['evento']!='' && req.query['actualizar'] != undefined) {
		if(typeof req.query['evento'] == 'string') {
			actualizar([req.query['evento']]);
		} else {
			actualizar(req.query['evento']);
		}
		
		function actualizar(listaEventos) {
			var eventosAsistir = [];
			var query = new Parse.Query(Eventos);
			query.find().then(function(results) {
				Parse.User.become(req.session.jUser.parseSessionToken).then(function (user) {
					for (var i = 1; i < results.length; i++) {
						var index = listaEventos.indexOf(String(results[i].id));
						var relation = results[i].relation("asistente");
						if(index > -1) {
							relation.add(user);
						} else {
							relation.remove(user);
						}
						eventosAsistir.push(results[i]);
					}
					return Parse.Object.saveAll(eventosAsistir);
				}).then(function(user) {	
					nPro();	
				}, function(error) {
					console.log(error);
					nPro();
				});
			}, function(error) {
				nPro();
			});
		}
	} else {
		nPro();
	}

	function nPro() {
		if(req.query['nombreEvento']!=undefined && req.query['nombreEvento']!='') {
			var evento = new Eventos();
			evento.set("Nombre", req.query['nombreEvento']);
			evento.save().then(function () {
				n();
			}, function(error) {
				n();
			});
		} else {
			n();
		}

		function n() {
			var lista = [];
			var limit = 0;
			function cumplido() {
				limit--;
				if(limit == 0) {
					res.render('events', { user: req.session.jUser , eventos: lista});
				}
			}

			var query = new Parse.Query(Eventos);
			query.find().then(function(results) {
				limit = results.length;
				for (var i = 0; i < results.length; i++) { 
					var object = results[i];
					lista[i] = {};
					lista[i].id = object.id;
					lista[i].nombre = object.get('Nombre');
					verAsistencia(lista[i],object.id);
				}
			});

			function verAsistencia(evento,objectId) {
				Parse.User.become(req.session.jUser.parseSessionToken).then(function (user) {
					var query = new Parse.Query(Eventos);
					query.equalTo("objectId", objectId);
					query.equalTo("asistente", user);
					query.find().then(function(results) {
						if(results.length > 0)
							evento.checked = true;
						else
							evento.checked = false;
						cumplido();
					});
				});
			}
		}
	}
});

module.exports = router;
