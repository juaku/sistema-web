// Conceccion con Parse
var Parse = require('./parseConnect').Parse;

// Encriptador
var crip = require('./crip');

var FB = require('fb');

// Genera hash de userId
var crypto = require('crypto');

// Guardar imagen en el servidor
var fs = require('fs');

var http = require('http');

var url = require('url');

var CronJob = require('cron').CronJob;

// Herramientas Geo - (Evaluar si es necesaria)
//var geolib = require('geolib');

var jPack = jPack || {};

// Variable contador de publicaciones
var postCount = 0;
var postUpdate = 50;

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
* seguridad, encripta el username y password.
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
	//hasheando userId
	text = this.id;
	key = '2903724R3c3D7j5G6y4R';
	var hash = crypto.createHmac('sha256', key);
	hash.update(text);
	var value = hash.digest('hex');
	user.set("userId", value);
	//fin hash
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

// TODO: Obsoleto
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
		var getImg = function(o, cb){
			var port = o.port || 80;
			var parsed = url.parse(o.url);
			var options = {
				host: parsed.hostname,
				port: port,
				path: parsed.path
			};
			http.get(options, function(res) {
				res.setEncoding('binary');   
				var imagedata = '';
				res.on('data', function(chunk){
					imagedata+= chunk; 
				});
				res.on('end', function(){
					fs.writeFile(o.dest, imagedata, 'binary', cb);
				});
			}).on('error', function(e) {
					console.log("Got error: " + e.message);
				});
		}
		getImg({
			url: profilePic,
			dest: "./public/images/profPic"+session.jUser.id+".png"
		},function(err){
			session.jUser.profilePicture = profilePic;
			next();
		})
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
			fbEventId : req.body.fbEvents,
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
						var str = jEvent.date;
						var resDate = str.split("/");
						resDate[1] = resDate[1] -1; //Se le resta 1 porque Enero es 0
						var str2 = jEvent.startTime;
						var resTime = str2.split(":");
						var date = new Date(Date.UTC(resDate[2], resDate[1], resDate[0], resTime[0], resTime[1],  0));
						event.set('name', jEvent.name);
						event.set('place', jEvent.place);
						event.set('date', date);
						event.set('address', jEvent.address);
						event.set('location', jEvent.location);
						event.set('description', jEvent.description);
					} else if(jEvent.source == 'fbe') {
						event.set('fbEventId', jEvent.fbEventId.split(',')[0]);
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
 * @descrip Inicia la secuencia de guradado de nuevo post
 * @param {object} newPost, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.newPost = function(newPost, next, error) {
	console.log('J0 - ' + this.parseSessionToken);
	console.log(newPost.coords);
	Parse.User.become(this.parseSessionToken).then(function (user) {
		console.log('J1');
		var Event = Parse.Object.extend("Event");
		var query = new Parse.Query(Event);
		query.equalTo("name", newPost.eventName);
		query.find().then(function(results) {
			if(results.length > 0) {
				console.log('J2');
				savePost(newPost, user, results[0], function() {
					next();
				}, function(e) {
					error(e);
				});
			} else {
				console.log('J3');
				var event = new Event();
				event.set('name', newPost.eventName);
				event.save().then(function(newEvent) {
					savePost(newPost, user, newEvent, function() {
						console.log('J4');
						next();
					}, function(e) {
						error(e);
					});
				}, function(e) {
					error(e);
				});
			}
		}, function(e) {
			error(e);
		});
	});
}

/*
 * @descrip Realiza la relación de seguidores, de acuerdo a quien quieras seguir 
 * @param {object} peopleToFollow, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.setNewFollowRelation = function(peopleToFollow, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var query = new Parse.Query(User);
		var relation = user.relation("following");
		var query = new Parse.Query(User);
		var arrayPeopleToFollow = []
		for(var i = 0; i<peopleToFollow.length; i++) {
			text = peopleToFollow[i].id.toString();
			key = '2903724R3c3D7j5G6y4R';
			var hash = crypto.createHmac('sha256', key);
			hash.update(text);
			var value = hash.digest('hex');
			arrayPeopleToFollow[arrayPeopleToFollow.length] = value;
		}
		query.containedIn("userId", arrayPeopleToFollow);
		query.find().then(function(results) {
			for (var i = 0; i < results.length; i++) {
				relation.add(results[i]);
			} 
			user.save();
		});
	});
}

/*
 * @descrip Obtiene los amigos de facebook que están usando juaku 
 * @param {object} req, {function} next, {function} error.
 * @return {array} usingIds
 */
jPack.user.prototype.showFriendsUsingApp = function(req, next, error) {
	var idProfile = req.session.passport.user.id;
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		req.session.jUser.getFriendsUsingApp(req.session, function(response) {
			if (response && !response.error) {
				var usingIds = [];
				for (var i = 0; i < response.length; i++) {
					usingIds[usingIds.length] = response[i];
				}
			}
			next(usingIds);
		})
	});
}

jPack.user.prototype.getFriendsUsingApp = function(session, next) {
	var idProfile = session.passport.user.id;
	var friendsUsing = [];
	var friendCount=0;
	FB.api('/'+idProfile+'/friends',{fields: 'installed, name',  access_token: this.accessToken}, function(response) {
		if (response && !response.error) {
			for(var i = 0; i<response.data.length; i++) {
				if(response.data[i].installed == true && response.data[i].id != idProfile) {
					friendsUsing[friendCount] = response.data[i];
					friendCount++;					
				}
			}
			next(friendsUsing);
		}
	});
}

/*
 * @descrip Guarda el post y establece las relaciones
 * @par {string} data, {object} user, {object} event, {function} next, {function} error.
 * @return null
 */ 
function savePost(data, user, event, next, error) {
	var mediaName = parseInt(Math.random(255,2)*10000);
	var mediaExt = 'jpg';
	saveMedia(data.media, mediaName, mediaExt, function() {
		var Post = Parse.Object.extend("Post");
		post = new Post();
		console.log(mediaName + mediaExt);
		post.set('media', mediaName + '.' + mediaExt);
		post.set('author', user);
		post.set('event', event);
		console.log(data.coords);
		post.set('coords', data.coords);
		var point = new Parse.GeoPoint({latitude: data.coords.latitude, longitude: data.coords.longitude});
		post.set("location", point);
		post.save().then(function(newPost) {
			postCount++;
			if(postCount >= postUpdate) {
				updateEventList();
			}
			next();
		}, function(e) {
			error(e);
		});
	}, function(e) {
		error(e);
	});
}

/*
 * @descrip Actualiza la lista de eventos más utilizados
 * @return null
 */

function updateEventList() {
	var Post = Parse.Object.extend('Post');
	var query = new Parse.Query(Post);
	var posts = [];
	var events = [];
}

/*
 * @decrip Convierte y guarda un objeto a disco
 * @param {string} data, {string} name, {string} ext, {function} next, {function} error.
 * @return null
 */
function saveMedia(data, name, ext, next, error) {
	var img = data;
	// Strip off the data: url prefix to get just the base64-encoded bytes
	var data = img.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	// TODO: Verificación de archivo
	fs.writeFile('./public/uploads/'+ name +'.'+ ext, buf);
	next();
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


/* @descrip Método para obtener los 15 primeros post de la BD
 * @param {function} next, {function} error
 * @return null
 */

jPack.getAllPosts = function(req, next, error) {
	var Post = Parse.Object.extend('Post');
	var query = new Parse.Query(Post);
	var posts = [];
	var events = [];
	//query.descending('createdAt');
	/*var now = new Date();
	var timeAgo = new Date();
	timeAgo.setHours(now.getHours() - 24);
	var timeAgoStr = timeAgo.toISOString();
	query.greaterThan("updatedAt", timeAgoStr);*/
	var point = new Parse.GeoPoint({latitude: -16.395169612966846, longitude: -71.53515145189272});
	query.near('location', point);
	query.include('author');
	query.include('event');
	query.find().then(function(results) {
		var c = results.length;
		for(var i in results) {
			posts[i] = {};
			posts[i].media = results[i].get('media');
			posts[i].event = results[i].get('event').get('name');
			posts[i].time = results[i].createdAt;
			//
			posts[i].location = {};
			posts[i].location.latitude = results[i].get('location').latitude;
			posts[i].location.longitude = results[i].get('location').longitude;
			//
			addMoment(results[i].get('event').get('name'));
			getFBInfo(i,crip.deco(results[i].get('author').get('username')));
		}

		function addMoment(name) {
			var index = -1;
			for(var i in events) {
				if(events[i].name == name) {
					index = i;
					break;
				}
			}
			if(index >= 0) {
				events[index].count++;
			} else {
				events[events.length] = {name: name, count: 1};
			}
		}

		function getFBInfo(i, fbUserId) {
			FB.api('/'+fbUserId+'/',  function(profile) {
				posts[i].author = {};
				posts[i].author.firstName = profile.first_name;
				posts[i].author.lastName = profile.last_name;
				FB.api('/'+fbUserId+'/picture?redirect=0&height=200&type=normal&width=200',  function(picture) {
					posts[i].author.picture= picture.data.url;
					triggerNext();
				});
			});
		}
		function triggerNext() {
			c--;
			if(c===0) {
				var response = {posts: posts, events: events};
				next(response);
			}
		}
	}, function(e) {
		error(e);
	});
}

/*
 * @descrip Método para obtener todos los eventos de la DB
 * @param {object} req, {function} next, {function} error
 * @return null
 */
jPack.getAllEvents = function(req, next, error) {
	/*
	var Event = Parse.Object.extend("Event");
	var query = new Parse.Query(Event);
	var events = [];
	query.equalTo("event");
	query.find().then(function(count) {
		console.log(count);
		next(count);
	});
*/
/*
	var Event = Parse.Object.extend("Event");
	var query = new Parse.Query(Event);
	var events = [];
	query.descending("createdAt");
	query.find().then(function(results) {
		var Post = Parse.Object.extend("Post");
		var counter = 0;
		for(var i = 0; i < results.length; i++) {
			events[i] = {};
			events[i].name = results[i].get('name');
		}
		//getEventCount();
		//next(events);
		var queries = [];
		for(var i = 0; i < events.length; i++) {
			queries[i] = new Parse.Query(Post);
			queries[i].equalTo("event", results[i]);
		}
		var mainQuery = Parse.Query.or.apply(this, queries);
		mainQuery.find().then(function(results) {
			for(var i = 0; i < results.length; i++) {
				//console.log(results.length);
			}
			//events[i].count = count;
			//counter++;
			//if(counter == results.length) {
			//	next(events);
			//}
			next(events);
		}, function(e) {
			error(e);
		});
		*/
		/*
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
						events[i].date = results[i].get('date').toUTCString();
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
		*/

/*		
	}, function(e) {
		error(e);
	});
*/
/*
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
	}*/
}

jPack.agenda = function () {

}

jPack.stadistics = function (registeredUsers, createdEvents) {
	this.registeredUsers = registeredUsers;
	this.createdEvents = createdEvents;
}

/*
 * @descrip Función para revisar la carga de la aplicación
 */

var job = new CronJob('*/30 * * * * *', function() {
	//console.log(postCount);
}, function () {
	// This function is executed when the job stops
},
	true /* Start the job right now *//*,
	timeZone /* Time zone of this job. */
);

module.exports = jPack;
