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
		}, function(error) {
			error(error);
		});
	}, function(error) {
			error(error);
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
			address : req.body.address,
			location : req.body.location,
			startTime : req.body.startTime,
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
					if(jEvent.source == 'ne') {
						event.set('name', jEvent.name);
						event.set('place', jEvent.place);
						event.set('address', jEvent.address);
						event.set('location', jEvent.location);
						event.set('description', jEvent.description);
					} else if(jEvent.source == 'fbe') {
						console.log(jEvent.fbEventId);
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
			error: function(error) {
				console.log(error);
		  }
		});

	}, function(error) {
				error(error);
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

jPack.event.prototype.getEventCoverImage = function(accessToken, next, error) {
	FB.api(this.id, {fields: 'cover', access_token: accessToken }, function (response) {
		if (!response && response.error) {
			console.log(results.error);
			error();
		}
		next(response);
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
				for(i in results) {
					events[i] = {};
					var fbEventId = results[i].get('fbEventId');
					if(fbEventId != undefined && fbEventId  != null) {
						jEvent = new jPack.event(events[i]);
						console.log(results[i]);
						console.log(jEvent);
					} else {
						events[i].name = results[i].get('name');
						events[i].location = results[i].get('location');
						events[i].address = results[i].get('address');
					}
					events[i].attendance = findIfAttended(results[i].id, response);
					events[i].type = getEventType(results[i].get('type'), types);
				}
				next(events);
			},function(error) {
				error(error);
			});
		}, function(error) {
			error(error);
		});
	}, function(error) {
		error(error);
	});

	// TODO: Revisar caso de false
	function getEventType(typeObject, types) {
		for(i in types) {
			if(typeObject != undefined) {
				if(types[i].id == typeObject.id) {
					return types[i].get('type');
				}
			}
		}
		return false;
	}

	function findIfAttended(eventId, eventsAttended) {
		for(i in eventsAttended) {
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
