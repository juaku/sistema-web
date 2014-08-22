// Conceccion con Parse
var Parse = require('./parseConnect').Parse;

// Encriptador
var crip = require('./crip');

var jPack = jPack || {}

var FB = require('fb');

/*
* Clase User 
* @descrip esta clase es la encargada de asignar los datos
* correspondientes que necesite un usuario para registrarse.
* @param {objeto} user     
* @return {jPack.user()}
*/
jPack.user = function (user) {
	this.id = user.id;																			//{string}
	this.firstName = user.firstName;												//{string}
	this.lastName = user.lastName;													//{string}
	this.email = user.email;																//{string}
	this.birthday = user.birthday;													//{date}
	this.gender = user.gender;															//{char}
	this.location = user.location;													//{string}
	this.hometown = user.hometown;													//{string}
	this.locale = user.locale;															//{object}
	this.facebookUrl = user.facebookUrl;										//{string}
	this.accessToken = user.accessToken;										//{string}
	this.expires = user.expires;														//{string}
	this.parseSessionToken = user.parseSessionToken;				//{string}
	this.profilePicture = user.profilePicture;							//{url}
}

// TODO: Borrar
/*
jPack.user.prototype.prueba = function() {
	return this.firstName;
}*/

/*
* SingUp 
* @descrip esta clase es la encargada de registrarte, y para mayor
* seguridad, encripta tu username y password.
* @param {string} session, {function} next, {function} error  
* @return null
*/
jPack.user.prototype.signUp = function(session, next, error) {
	var user = new Parse.User();
	user.set("username", crip.enco(this.id));
	user.set("password", crip.enco(this.id));

	var authData = {"facebook":{
		"id": this.id,
		"access_token": this.accessToken,
		"expiration_date": new Date(this.expires).toISOString(),
	}};

	user.set("authData", authData);
	user.signUp(null, {
		success: function(user) {
			session.jUser.parseSessionToken = user.getSessionToken();
			next();
		},
		error: function(user, error) {
			console.log("Error: " + error.code + " " + error.message);
			error();
		}
	});
}

jPack.user.prototype.getFbEvents = function(next, error) {
	FB.api('me/events/created',{ access_token: this.accessToken }, function(results) {
		if(!results || results.error) {
			console.log(results.error);
			return;
		} else {
			next(results);
		}
	});
}

/*
* Método para obtener la foto de perfil 
* @descrip este método es el encargado de tomar la foto de perfil
* de fb y asignarla como un atributo más a la clase user dentro de session
* @param {session, next}   
* @return null
*/
jPack.user.prototype.getProfilePicture = function(session, next) {
	var profilePic;
	var idProfile = session.passport.user.id;
	FB.api('/'+idProfile+'/picture?redirect=0&height=200&type=normal&width=200',  function(response) {
		profilePic = response.data.url;
		session.jUser.profilePicture = profilePic;
		next();
	});
}

/*
 * @descrip Método para obtener todos los eventos a los que el usuario asistió
 * @param {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.getAttendance = function(next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var Events = Parse.Object.extend("Events");
		var query = new Parse.Query(Events);
		query.equalTo("attendance", user);
		query.find().then(function(results) {
			next(results);
		}, function(e) {
			error(e);
		});
	}, function(e) {
			error(e);
	});
}

/*
 * @descrip Método para crear un evento, y relacionarlo con su tipo
 * @param {string} eType, {function} req, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.createEvent = function(req, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var jEvent = new jPack.event ({
			name : req.body.name,
			place : req.body.place,
			date : req.body.date,
			address : req.body.address,
			location : req.body.location,
			startTime : req.body.time,
			endTime : req.body.endTime,
			type : req.body.type,
			description : req.body.description,
			fbEventId : req.body.fbEvents[0],
			source : req.body.source
		});

		var EventType = Parse.Object.extend("EventType");
		var Events = Parse.Object.extend("Events");
		var type = new EventType();
		var query = new Parse.Query(EventType);
		query.equalTo("type", jEvent.type);
		query.find({
			success: function(results) {
				if(results.length) {
					event = new Events();
					var relation = event.relation('admins');
					relation.add(user);
					event.set('type', results[0]);
					var str = jEvent.date;
					var resDate = str.split("/");
					resDate[1] = resDate[1] -1; //Se le resta 1 porque Enero es 0
					var str2 = jEvent.startTime;
					var resTime = str2.split(":");
					var date = new Date(Date.UTC(resDate[2], resDate[1], resDate[0], resTime[0], resTime[1],  0));

					if(jEvent.source == 'ne') {
						event.set('name', jEvent.name);
						event.set('place', jEvent.place);
						event.set('date', date);
						event.set('address', jEvent.address);
						event.set('location', jEvent.location);
						event.set('description', jEvent.description);
					} else if(jEvent.source == 'fbe') {
						event.set('fbEventId', jEvent.fbEventId);
					}
					event.save().then(function () {
						next();
					}, function(error) {
						console.log(error);
					});
				} else {
					next();
				}
			},
			error: function(e) {
				error(e);
		  }
		});

	}, function(e) {
		error(e);
	});
}

/*
 * @descrip Registra la asistencia de un usuario al evento
 * @param {string} eventId, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.joinEvent = function(eventId, next, error) {
	updateEventAttendance(true, this.parseSessionToken, eventId, function () {
		next();
	}, function(e) {
		error(e);
	});
}

/*
 * @descrip Elimina la asistencia de un usuario al evento
 * @param {string} eventId, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.leaveEvent = function(eventId, next, error) {
	updateEventAttendance(false, this.parseSessionToken, eventId, function () {
		next();
	}, function(e) {
		error(e);
	});
}

/*
 * @descrip Actualiza la asistencia de un usuario al evento
 * @param {boolean} join, {string} parseSessionToken, {string} eventId,
 * {function} next, {function} error.
 * @return null
 */
function updateEventAttendance(join, parseSessionToken, eventId, next, error) {
	Parse.User.become(parseSessionToken).then(function (user) {
		var Events = Parse.Object.extend("Events"); 
		var query = new Parse.Query(Events);
		query.equalTo("objectId", eventId);
		query.find().then(function(results) {
			var event = results[0];
			var relation = event.relation("attendance");
			if(join) {
				relation.add(user);
			} else {
				relation.remove(user);
			}
			event.save().then(function () {
				next();
			}, function(e) {
				error(e);
			});
		}, function(e) {
			error(e);
		});
	}, function(e) {
		error(e);
	});
}

/*
* Clase Evento 
* @descrip esta clase es la encargada de exportar los datos
* correspondientes de un evento en Facebook que necesite un usuario para crear
* un evento
* @param {objeto} event     
* @return null
*/
jPack.event = function (event) {
	this.name = event.name;																	//{string}
	this.place = event.place;																//{string}
	this.date = event.date;																	//{object}													
	this.address = event.address;														//{string}
	this.location = event.location;													//{string}
	this.startTime = event.startTime;												//{date}
	this.endTime = event.endTime;														//{date}
	this.type = event.type;																	//{string}
	this.description = event.description;										//{string}
	this.fbEventId = event.fbEventId;												//{string}
	this.source = event.source;															//{string}
	//this.assistantsNumber = event.assistantsNumber;				//{int}
	//this.timeZone = event.timeZone;												//{string}
	//this.geoPoint = geoPoint;															//{array}
}

jPack.event.prototype.getEventCoverObject = function(accessToken, index, next, error) {
	FB.api(this.fbEventId, {fields: 'cover', access_token: accessToken }, function (response) {
		if (!response && response.error) {
			console.log(results.error);
			error();
		}
		next(response, index);
	});
}

/*
 * @descrip Método para obtener todos los eventos de la DB y la asistencia del
 * usuario actual en {boolean}
 * @param {object} req, {function} next, {function} error
 * @return null
 */
jPack.getAllEvents = function(req, next, error) {
	var Events = Parse.Object.extend("Events");
	var query = new Parse.Query(Events);
	var events = [];
	query.descending("createdAt");
	query.find().then(function(results) {
		var jUser = new jPack.user(req.session.jUser);
		jUser.getAttendance(function(response) {
			var EventType = Parse.Object.extend("EventType");
			var query = new Parse.Query(EventType);
			query.find().then(function(types) {
				var counter = results.length;
				for(var i in results) {
					events[i] = {};
					var fbEventId = results[i].get('fbEventId');
					events[i].id = results[i].id;
					if(fbEventId == undefined || fbEventId  == null) {
						events[i].name = results[i].get('name');
						events[i].location = results[i].get('location');
						events[i].address = results[i].get('address');
						nextInfo(i);
					} else {
						jEvent = new jPack.event({fbEventId: results[i].get('fbEventId')});
						jEvent.getEventCoverObject(req.session.jUser.accessToken, i, function(cover, i) {
							events[i].cover = cover.cover.source;
							nextInfo(i);
						}, function(error) {
							error(error);
						});
					}
					function nextInfo(i) {
						events[i].joined = findIfAttended(results[i].id, response);
						events[i].type = getEventType(results[i].get('type'), types);
						triggerNext();
					}
					function triggerNext() {
						counter--;
						if(counter===0) {
							next(events);
						}
					}
				}
			},function(e) {
				error(e);
			});
		}, function(e) {
			error(e);
		});
	}, function(e) {
		error(e);
	});

	function getEventType(typeObject, types) {
		var type = undefined;
		for(var i in types) {
			if(typeObject != undefined && types[i].id == typeObject.id) {
				type = types[i].get('type');
			}
		}
		return type;
	}

	function findIfAttended(eventId, eventsAttended) {
		for(var i in eventsAttended) {
			if(eventsAttended[i].id == eventId)
				return true;
		}
		return false;
	}
}

jPack.agenda = function () {

}

jPack.stadistics = function (registeredUsers, createdEvents) {
	this.registeredUsers = registeredUsers;
	this.createdEvents = createdEvents;
}

module.exports = jPack;
