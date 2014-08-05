var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

var FB = require('fb');

//Clases jPack
var jPack = require('../jPack');

//Concección con Parse
var Parse = require('../parseConnect').Parse;


//TODO: Implementar angularjs
router.post('/', ensureAuthenticated,function(req, res) {
	var accessToken = req.session.passport.user.accessToken;

	if(accessToken!=undefined && accessToken!='' ) {
			exportarEvento();
		};

		function exportarEvento() {
			//Exportación del evento de Facebook
			FB.api('me/events/created',{ access_token: accessToken }, function(results){
				if(!results || results.error) {
					console.log(results.error);
					return;
				}
				var id = results.data[0].id;
				var name = results.data[0].name;
				var startTime = results.data[0].start_time;
				var endTime = results.data[0].end_time;
				var location = results.data[0].location;

				FB.api(id, {access_token: accessToken}, function (response) {
						if (!response && response.error) {
							console.log(results.error);
							return;
						}
						var description = response.description;
						FB.api(id, {fields: 'cover', access_token: accessToken }, function (response) {
							if (!response && response.error) {
								console.log(results.error);
								return;

							}
							req.session.jEvent = new jPack.event ({
								id : id,
								name : name,
								description : description ,
								startTime : startTime,
								endTime : endTime,
								//assistantNumber : results.data[1].fql_result_set[0].attending_count ,
								cover : response.cover.source,
								location : location
							});
							var jEvent = req.session.jEvent;
							jEvent.exportEvent();
							res.json(jEvent);
							}
						);
					}
				);
			});
		}
});


router.get('/', ensureAuthenticated, function(req, res) {
	//TODO: Pasar esto a jPack

	if(req.query['source']=='fb'){
				var accessToken = req.session.passport.user.accessToken;
				FB.api('me/events/created',{ access_token: accessToken }, function(results){
				if(!results || results.error) {
					console.log(results.error);
					return;
				}
						var id = results.data[0].id;
					FB.api(id, {access_token: accessToken}, function (response) {
							if (!response && response.error) {
								console.log(results.error);
								return;
							}
							var description = response.description;
							FB.api(id, {fields: 'cover', access_token: accessToken }, function (response) {
								if (!response && response.error) {
									console.log(results.error);
									return;

								}

								res.json(results);
								}
							);
						}
					);
				
			});
	}

	else{
		var Eventos = Parse.Object.extend("Eventos");
/*	
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
*/

var query = new Parse.Query(Eventos);
				query.find().then(function(results) {
					res.json(results);
				});
/*		function nPro() {
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
		}*/

	}
	
});

module.exports = router;
