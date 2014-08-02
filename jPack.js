//Conceccion con Parse
var Parse = require('./parseConnect').Parse;

//Encriptador
var crip = require('./crip');

var jPack = jPack || {}

/*

* Clase User 
* @descrip esta clase es la encargada de asignar los datos
* correspondientes que necesite un usuario para registrarse.
* @param {objeto} user     
* @return {jPack.user()}

*/

jPack.user = function (user) {
	this.id = user.id;																			//{string}
	this.profilePicture = user.profilePicture;
	this.firstName = user.firstName;												//{string}
	this.lastName = user.lastName;													//{string}
	this.email = user.email;																//{string}
	this.birthday = user.birthday;													//{date}
	this.gender = user.gender;															//{char}
	this.location = user.location;													//{string}
	this.hometown = user.hometown;													//{string}
	this.locale = user.locale;															//{string}
	this.facebookUrl = user.facebookUrl;										//{string}
	this.accessToken = user.accessToken;										//{string}
	this.expires = user.expires;														//{string}
	this.parseSessionToken = user.parseSessionToken;				//{string}
}

jPack.user.prototype.prueba = function() {
	return this.firstName;
}

/*

* SingUp 
* @descrip esta clase es la encargada de registrarte, y para mayor
* seguridad, encripta tu username y password.
* @param {string} session, {string} s -succes- , {string} e -error-  
* @return {jPack.user.prototype.signUp}

*/

jPack.user.prototype.signUp = function(session, s,e) {
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
			s();
		},
		error: function(user, error) {
			console.log("Error: " + error.code + " " + error.message);
			e();
		}
	});
}

/*

* Clase Evento 
* @descrip esta clase es la encargada de exportar los datos
* correspondientes de un evento en Facebook que necesite un usuario para crear
* un evento
* @param {objeto} user     
* @return {jPack.user()}

*/


jPack.event = function (event) {
	this.id = event.id;																			//{string}
	this.name = event.name;																	//{string}
	this.description = event.description;										//{string}
 	this.startTime = event.startTime;												//{date}
 	this.endTime = event.endTime;														//{date}
 	this.timeZone = event.timeZone;													//{date}
 	this.assistantsNumber = event.assistantsNumber;					//{int}
//this.cover = event.cover;
	this.location = event.location;													//{string}
 //this.geoPoint = geoPoint;
}


jPack.event.prototype.prueba = function() {
	return this.name;
}

jPack.event.prototype.exportEvent = function() {
		var Eventos = Parse.Object.extend("Eventos");
		if(this.name!=undefined && this.name!='') {
			var evento = new Eventos();
			evento.set("Nombre", this.name);
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
		}
}


jPack.agenda = function () {

}

jPack.stadistics = function (registeredUsers, createdEvents) {
	this.registeredUsers = registeredUsers;
	this.createdEvents = createdEvents;
}


module.exports = jPack;
