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
* @param {string} session, {funtcion} next, {funtcion} error  
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

jPack.user.prototype.getFbEvents = function(accessToken, next) {
	FB.api('me/events/created',{ access_token: accessToken }, function(results) {
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
		query.equalTo("asistente", user);
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
 * @descrip Método para crear un evento con juaku
 * @param {string} eType, {function} req, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.createEvent = function(eType, req, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var EventType = Parse.Object.extend("EventType");
		var Events = Parse.Object.extend("Events");
		var type = new EventType();
		var query = new Parse.Query(EventType);
		query.equalTo("type", eType);
		query.find({
			success: function(results) {
				if(results.length){
					event = new Events();
					event.set('name', req.body.name);
					event.set('place', req.body.place);
					event.set('date', req.body.date);
					event.set('type', results[0]);
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
	this.id = event.id;																			//{string}
	this.name = event.name;																	//{string}
	this.description = event.description;										//{string}
 	this.startTime = event.startTime;												//{date}
 	this.endTime = event.endTime;														//{date}
 	this.timeZone = event.timeZone;													//{date}
	//this.assistantsNumber = event.assistantsNumber;				//{int}
	this.cover = event.cover;																//{url}
	this.location = event.location;													//{string}
 	//this.geoPoint = geoPoint;
}

/*
 * @descrip Método para asignar el id de un evento de fb a la base de datos
 * @param {string} eType, {function} next, {function} error.
 * @return null
*/

jPack.event.prototype.setIdFbEvent = function(eType, next, error) {
	var Events = Parse.Object.extend("Events");
	if(this.id!=undefined && this.id!='') {
		var event = new Events();
		var query = new Parse.Query(EventType);
		query.equalTo("type", eType);
		query.find({
			success: function(results) {
				if(results.length){
					event = new Events();
					event.set('idFbEvent', this.id);
					event.set('type', results[0]);
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
	} else {
		error('Id vacio');
	}
}

jPack.event.prototype.getEventCoverImage = function(next) {
	FB.api(this.id, {fields: 'cover', access_token: accessToken }, function (response) {
		if (!response && response.error) {
			console.log(results.error);
			return;
		}
		return next(response);
	});
}

jPack.agenda = function () {

}

jPack.stadistics = function (registeredUsers, createdEvents) {
	this.registeredUsers = registeredUsers;
	this.createdEvents = createdEvents;
}

module.exports = jPack;
