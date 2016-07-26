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

//Para restingir el uso del @, signos de admiración, interrogación y caracteres especiales
var validate = require("validate.js")

// Herramientas Geo - (Evaluar si es necesaria)
//var geolib = require('geolib');

//Modelos BD
var Tag = require('./models/tag');
var Action = require('./models/action');
var User = require('./models/user');

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
	this.id = user.id;																			// {string}
	this.firstName = user.firstName;												// {string}
	this.lastName = user.lastName;													// {string}
	this.email = user.email;																// {string}
	this.birthday = user.birthday;													// {date}
	this.gender = user.gender;															// {char}
	this.locale = user.locale;															// {object}
	this.facebookUrl = user.facebookUrl;										// {string}
	this.accessToken = user.accessToken;										// {string}
	this.expires = user.expires;														// {string}
	this.parseSessionToken = user.parseSessionToken;				// {string}
	this.profilePicture = user.profilePicture;							// {url}
	this.coords = user.coords;
}

/*
* SingUp 
* @descrip esta clase es la encargada de registrarte, y para mayor
* seguridad, encripta el username y password.
* @param {string} session, {function} next, {function} error  
* @return null
*/
jPack.signUp = function(req, next, error) {
	/*var user = new Parse.User();
	console.log('singn up //////////////////////////////////////////////////////////////////////////');
	console.log(user);
	console.log(user.getSessionToken());
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
	});*/
}

/*
* Método para obtener la foto de perfil 
* @descrip este método es el encargado de tomar la foto de perfil
* de fb y asignarla como un atributo más a la clase user dentro de session
* @param {session, next}   
* @return null
*/
jPack.getProfilePicture = function(session, next) {
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
			dest: "./public/images/profPic"+session.id+".png"
		},function(err){
			session.jUser.profilePicture = profilePic;
			console.log(session.jUser.profilePicture);
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
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
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
	});*/
}

/*
 * @descrip Método para crear un evento, y relacionarlo con su tipo
 * @param {string} eType, {function} req, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.createEvent = function(req, next, error) {
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
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
	});*/
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

jPack.showActions = function(userId, accessToken, actions, providerId, hexCode, next) {
	var posts = [];
	var savedActions;
	countActions = actions.length;
	if(actions.length == 0) {
		next(actions);
	}
	User.findById(userId, 'savedActions', function (err, user) {
		savedActions = user.savedActions;
	});
	for(var i in actions) {
		posts[i] = {};
		posts[i].id = actions[i]._id;
		if(providerId != undefined && hexCode	!= undefined) {
			if(actions[i].authorId != userId ) {
				getProviderId(actions[i].authorId, i);
			} else {
				posts[i].fbId = providerId;
				getFBInfo(i, posts[i].fbId, hexCode);
			}
		} else {
			getProviderId(actions[i].authorId, i);
		}
		posts[i].authorId = actions[i].authorId;
		posts[i].tag = actions[i].name;
		posts[i].time = actions[i].createdAt;
		posts[i].media = './uploads/' + actions[i].media;
		posts[i].location = {};
		posts[i].location.latitude = actions[i].geo[0];
		posts[i].location.longitude = actions[i].geo[1];
	}
	function getProviderId(id, i) {
		User.findById(id, 'providerId hexCode', function (err, user) {
			posts[i].fbId = user.providerId;
			if(savedActions.indexOf(posts[i].id) > -1) {
				posts[i].saved = true;
			} else {
				posts[i].saved = false;
			}
			getFBInfo(i, posts[i].fbId, user.hexCode, user.savedActions);
		});
	}
	function getFBInfo(i, fbUserId, hexCode) {
		FB.api('/'+fbUserId+'/', {access_token: accessToken}, function(profile) {
			posts[i].author = {};
			posts[i].author.firstName = profile.first_name;
			posts[i].author.lastName = profile.last_name;
			posts[i].author.hexCode = hexCode;
			FB.api('/'+fbUserId+'/picture?redirect=0&height=200&type=normal&width=200',  function(picture) {
				posts[i].author.picture= picture.data.url;
				triggerNext();
			});
		});
	}
	function triggerNext() {
		countActions--;
		if(countActions===0) {
			var response = {posts: posts};
			next(response);
		}
	}
}

jPack.validateTagName = function(newAction, next, error) {
	var pattern = /[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]*\w[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+/; // var pattern = /@[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]*\w[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+/;
	var flag = validate({post: newAction.eventName}, {post: {format: pattern}});

	if(flag!=undefined) {
		console.log("ERROR!! AL INSERTAR NOMBRE DE EVENTO");
		error();
	} else {
		var simpleEventName = simplifyName(newAction.eventName);
		var mediaName = parseInt(Math.random(255,2)*10000);
		var mediaExt = 'jpg';
		if( newAction.coords == undefined ) {
			newAction.coords = {};
			newAction.coords.latitude = -16.3989;
			newAction.coords.longitude = -71.535;
		}
		next(simpleEventName, mediaName, mediaExt);
	}
}

/*
 * @descrip Inicia la secuencia de guradado de nuevo post
 * @param {object} newPost, {function} next, {function} error.
 * @return null
 */
jPack.newPost = function(req, next, error) {
	var newAction = req.body;
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
	console.log('J1');
	var Event = Parse.Object.extend("Event");
	var query = new Parse.Query(Event);*/

	Tag.newAction(req, simpleEventName, newAction, mediaName, mediaExt, req.session.passport.user._id, function (err, tag) {
		next();
	});

		//query.equalTo("name", simpleEventName);
		/*savePost(req, simpleEventName, newAction, function() { //savePost(req, simpleEventName, newAction, user, function() {
			console.log('J4');
			next();
		}, function(e) {
			error(e);
		});*/

			/*query.equalTo("name", simpleEventName);
			query.find().then(function(results) {
				if(results.length > 0) {
					console.log('J2');
					savePost(req, simpleEventName, newPost, user, results[0], function() {
						next();
					}, function(e) {
						error(e);
					});
				} else {
					console.log('J3');
					var event = new Event();
					event.set('name', simpleEventName);
					event.set('eventName', newPost.eventName);
					event.save().then(function(newEvent) {
						savePost(req, simpleEventName, newPost, user, newEvent, function() {
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
			});*/
		//});
}

function simplifyName(eventName) {
	var simpleEventName = eventName;
	var diacritics =[
		/[\300-\306]/g, /[\340-\346]/g,  // A, a
		/[\310-\313]/g, /[\350-\353]/g,  // E, e
		/[\314-\317]/g, /[\354-\357]/g,  // I, i
		/[\322-\330]/g, /[\362-\370]/g,  // O, o
		/[\331-\334]/g, /[\371-\374]/g,  // U, u
		/[\321]/g, /[\361]/g, // N, n
		/[\307]/g, /[\347]/g, // C, c
	];
	var chars = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
	for (var i = 0; i < diacritics.length; i++) {
		simpleEventName = simpleEventName.replace(diacritics[i],chars[i]);
	}
	return simpleEventName.toLowerCase();
}

/*D
 * @descrip Asigna relación de like con el post clickeado
 * @param {object} post, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.setLike = function(post, next, error) {
	//console.log('J0 - ' + this.parseSessionToken);
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
		var Post = Parse.Object.extend("Post");
		var query = new Parse.Query(Post);
		var relation = user.relation("likes");

		query.equalTo("publicId", post.id);
		query.find().then(function(postLiked) {
			relation.add(postLiked[0]);
			user.save();
			next();
		}, function(e) {
			error(e);
		});
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Remueve relación de like con el post clickeado
 * @param {object} newPost, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.setUnlike = function(post, next, error) {
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
		var Post = Parse.Object.extend("Post");
		var query = new Parse.Query(Post);
		var relation = user.relation("likes");

		query.equalTo("publicId", post.id);
		query.find().then(function(postUnLiked) {
			relation.remove(postUnLiked[0]);
			user.save();
			next();
		}, function(e) {
			error(e);
		});
		next();
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Crea la relación de seguir a una persona 
 * @param {object} userToFollow, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.setFollowRelation = function(userToFollow, next, error) {
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var Follow = Parse.Object.extend("Follow");
		follow = new Follow();
		var queryUser = new Parse.Query(User);
		if(userToFollow.username != undefined) {
			queryUser.equalTo("username", userToFollow.username);
			queryUser.find().then(function(userFollowed) {
				follow.set("from", user);//También puede usarse Parse.User.current() en vez de 'user', objeto del usuario actual
				follow.set("to", userFollowed[0]);//objecto del usuario a seguir
				follow.set("date", Date());
				follow.save();
				console.log("Empezaste a seguir a " + userToFollow.firstName);
				next();
			}, function(e) {
				error(e);
			});
		}
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Deshace la relación de seguir a una persona 
 * @param {object} userToFollow, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.setUnFollowRelation = function(userToFollow, next, error) {
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var Follow = Parse.Object.extend("Follow");
		var queryUser = new Parse.Query(User);
		var relationObjectId= ""; //Este es el objectId de la relación a eliminar
		if(userToFollow.username != undefined) {
			queryUser.equalTo("username", userToFollow.username);
			queryUser.find().then(function(userFollowed) {
				var queryFollow = new Parse.Query(Follow);
				queryFollow.equalTo("from", user);
				queryFollow.equalTo("to", userFollowed[0]);
				queryFollow.find().then(function(userToUnFollow) {
					relationObjectId = userToUnFollow[0].id;
					var mainQueryFollow = new Parse.Query(Follow);
						mainQueryFollow.get(relationObjectId).then(function(relation) {
							relation.destroy().then(function(){
								console.log("dejaste de seguir a " + userToFollow.firstName);
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
			}, function(e) {
				error(e);
			});
		}
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Obtiene todas las personas que siguen al usuario actual
 * @param {object} req, {function} next, {function} error.
 * @return {array} followers
 */
jPack.user.prototype.getFollowers = function(req, next, error) {
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
		var followers = [];
		var followersItemCount = 0;
		var Follow = Parse.Object.extend("Follow");
		var queryFollow = new Parse.Query(Follow);
		queryFollow.include("from");
		queryFollow.equalTo("to", user);
		queryFollow.find().then(function(users) {
			console.log("users.length " + users.length);
			if(users.length != 0) {
				followersItemCount = users.length;
				console.log("Te siguen: " + users.length + " personas.");
				var userResult, columnTo, date, fbUserId;
				for(var i = 0; i<users.length; i++) {
					userResult = users[i];
					columnTo = userResult.get("from");
					date = userResult.get("date");
					fbUserId = crip.deco(columnTo.get("username"));
					getFBInfo(i, fbUserId);
				}
				function getFBInfo(i, fbUserId) {
					FB.api('/'+fbUserId+'/', {access_token: req.session.passport.user.accessToken},  function(profile) {
						followers[i] = {};
						followers[i].firstName = profile.first_name;
						followers[i].lastName = profile.last_name;
						followers[i].date = date;
						FB.api('/'+fbUserId+'/picture?redirect=0&height=200&type=normal&width=200',  function(picture) {
							followers[i].picture= picture.data.url;
							triggerNext();
						});
					});
				}
				function triggerNext() {
					followersItemCount--;
					if(followersItemCount===0) {
						next(followers);
					}
				}
			} else { 
				console.log("No tienes seguidores");
				next(followers);
			}
		}, function(e) {
			error(e);
		});
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Obiene todas las personas que el usuario actual está siguiendo
 * @param {object} req, {function} next, {function} error.
 * @return {array} following
 */
jPack.user.prototype.getFollowing = function(req, next, error) {
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
		var following = [];
		var followingItemCount = 0;
		var Follow = Parse.Object.extend("Follow");
		var queryFollow = new Parse.Query(Follow);
		queryFollow.include("to");
		queryFollow.equalTo("from", user);
		queryFollow.find().then(function(users) {
			if(users.length != 0) {
				followingItemCount = users.length;
				console.log("Estás siguiendo: " + users.length + " personas.");
				for(var i = 0; i<users.length; i++) {
					var userResult = users[i];
					var columnTo = userResult.get("to");
					var fbUserId = crip.deco(columnTo.get("username"));
					var date = userResult.get("date");
					getFBInfo(i, fbUserId);
					function getFBInfo(i, fbUserId) {
						FB.api('/'+fbUserId+'/', {access_token: req.session.passport.user.accessToken},  function(profile) {
							following[i] = {};
							following[i].firstName = profile.first_name;
							following[i].lastName = profile.last_name;
							following[i].date = date;
							FB.api('/'+fbUserId+'/picture?redirect=0&height=200&type=normal&width=200',  function(picture) {
								following[i].picture= picture.data.url;
								triggerNext();
							});
						});
					}
					function triggerNext() {
						followingItemCount--;
						if(followingItemCount===0) {
							next(following);
						}
					}
				}
			} else {
				console.log("No estás siguiendo a nadie");
				next(following);
			}
		}, function(e) {
			error(e);
		});
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Obtiene los amigos de facebook que están usando la aplicación 
 * @param {object} req, {function} next, {function} error.
 * @return {array} usingIds
 */
jPack.user.prototype.getFriendsUsingApp = function(req, next, error) {
	/*var idProfile = req.session.passport.user.id;
	var friendsUsing = [];
	var aux = 0; //variable que controla si ya asignó el atributo following a todos los usuarios
	Parse.User.become(this.parseSessionToken).then(function (user) {
		FB.api('/'+idProfile+'/friends',{fields: 'installed, name',  access_token: req.session.passport.user.accessToken}, function(response) {
			if (response && !response.error) {
				for(var i = 0; i<response.data.length; i++) {
					if(response.data[i].installed == true && response.data[i].id != idProfile) {
						friendsUsing[i] = {};
						friendsUsing[i].installed = response.data[i].installed;
						friendsUsing[i].name = response.data[i].name;
						text = response.data[i].id;
						key = '2903724R3c3D7j5G6y4R';
						var hash = crypto.createHmac('sha256', key);
						hash.update(text);
						var value = hash.digest('hex');
						friendsUsing[i].id = value;
						isFollowing(friendsUsing[i], function() {
							aux = aux + 1;
							if(aux == friendsUsing.length) {
								next(friendsUsing);
							}
						}, function(e) {
							error(e);
						});
					}
				}
			}
		});
		function isFollowing (friendsUsing, next, error) {
			var User = Parse.Object.extend("User");
			var Follow = Parse.Object.extend("Follow");
			var queryUser = new Parse.Query(User);
			queryUser.equalTo("userId", friendsUsing.id);
			queryUser.find().then(function(results) {
				var queryFollow = new Parse.Query(Follow);
				queryFollow.equalTo("from", user);
				queryFollow.equalTo("to", results[0]);
				queryFollow.find().then(function(response) {
					if(response.length != 0) {
						friendsUsing.following = true;
						next();
					}else {
						friendsUsing.following = false;
						next();
					}
				}, function(e) {
					error(e);
				});
			}, function(e) {
				error(e);
			});
		}
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Obtiene los amigos de facebook que están usando la aplicación 
 * @param {object} req, {function} next, {function} error.
 * @return {array} usingIds
 */
jPack.user.prototype.getAllUsers = function(req, next, error) {
	/*var idProfile = req.session.passport.user.id;
	var allUsers = [];
	var aux = 0; //variable que controla si ya asignó el atributo following a todos los usuarios
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var relation = user.relation("blockedUsers");
		var queryUser = new Parse.Query(User);
		//queryUser.notEqualTo("objectId", user.id);
		queryUser.find().then(function(users) {
			relation.query().find().then(function(listOfBlockedUsers) {
			// listOfBlockedUsers contiene los usuarios que el usuario actual bloqueó
				for(var i = 0; i<users.length; i++) {
						allUsers[i] = {};
						allUsers[i].username = users[i].attributes.username;
						allUsers[i].idKey = users[i].attributes.idKey;
						getFBInfo(i, crip.deco(users[i].attributes.username));
				}
				function getFBInfo(i, fbUserId) {
					FB.api('/'+fbUserId+'/', {access_token: req.session.passport.user.accessToken},  function(profile) {
						allUsers[i].firstName = profile.first_name;
						allUsers[i].lastName = profile.last_name;
						FB.api('/'+fbUserId+'/picture?redirect=0&height=200&type=normal&width=200',  function(picture) {
							allUsers[i].picture= picture.data.url;
							if(listOfBlockedUsers.length == 0) {
								allUsers[i].block = false;
							} else {
								for(var j = 0; j<listOfBlockedUsers.length; j++) {
									if(listOfBlockedUsers[j].attributes.username == allUsers[i].username) {
										allUsers[i].block = true;
										break;
									} else {
										allUsers[i].block = false;
									}
								}
							}
							isFollowing(allUsers[i], function() {
								aux = aux + 1;
								if(aux == allUsers.length) {
									var response = {users: allUsers};
									next(response);
									//next(allUsers);
								}
							}, function(e) {
								error(e);
							});
						});
					});
				}
				function isFollowing (allUsers, next, error) {
					var User = Parse.Object.extend("User");
					var Follow = Parse.Object.extend("Follow");
					var queryUser = new Parse.Query(User);
					queryUser.equalTo("username", allUsers.username);
					queryUser.find().then(function(userFollowed) {
						var queryFollow = new Parse.Query(Follow);
						queryFollow.equalTo("from", user);
						queryFollow.equalTo("to", userFollowed[0]);
						queryFollow.find().then(function(response) {
							if(response.length != 0) {
								allUsers.following = true;
								next();
							}else {
								allUsers.following = false;
								next();
							}
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
		}, function(e) {
			error(e);
		});
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Asigna relación de bloqueo
 * @param {object} userToBlock, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.blockUser = function(userToBlock, next, error) {
	/*Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var queryUser = new Parse.Query(User);//TODO: cambiar User por Parse.User
		var relation = user.relation("blockedUsers");
		
		if(userToBlock.username != undefined) {
			queryUser.equalTo("username", userToBlock.username);
			queryUser.find().then(function(blockedUser) {
				relation.add(blockedUser[0]);
				user.save();
				next();
			}, function(e) {
				error(e);
			});
		}
	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Remueve relación de bloqueo
 * @param {object} userToBlock, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.unBlockUser = function(userToBlock, next, error) {
	/*console.log("unBlockUser!");
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var queryUser = new Parse.Query(User);//TODO: cambiar User por Parse.User
		var relation = user.relation("blockedUsers");

		if(userToBlock.username != undefined) {
			queryUser.equalTo("username", userToBlock.username);
			queryUser.find().then(function(blockedUser) {
				relation.remove(blockedUser[0]);
				user.save();
				next();
			}, function(e) {
				error(e);
			});
		}
	}, function(e) {
		error(e);
	});*/
}

/*
 * @descrip Establece la información de genérica del usuario.
 * @par {obj} data, {function} next, {function} error.
 * @return null
 */ 
jPack.setGenericData = function(req, next, error) {
	// TODO: Evaluar
	this.coords = req.body.data.coords;
	req.session.coords = this.coords;
	next();
}

/*
 * @descrip Guarda el post y establece las relaciones
 * @par {string} data, {object} user, {object} event, {function} next, {function} error.
 * @return null
 */ 
function savePost(req, simpleEventName, data, next, error) {
	/*var mediaName = parseInt(Math.random(255,2)*10000);
	var mediaExt = 'jpg';
	if( data.coords == undefined ) {
		data.coords = {};
		data.coords.latitude = -16.3989;
		data.coords.longitude = -71.535;
	}*/
	// TODO: Evaluar ¿qué hacer? si la integridad de la información de cliente no es la que se esperaba
	/*if( data.coords == undefined ) {
		error();
		return;
	}*/
	/*saveMedia(data.media, mediaName, mediaExt, function(imgBase64) {
		console.log('mediaName + mediaExt:  ' + mediaName + '.' + mediaExt);
		var base64data = imgBase64;
		var namePhoto = mediaName;*/
		/*var coords = [];
		coords[0] = data.coords.latitude;
		coords[1] = data.coords.longitude;*/
		//Parse
		/*var parseFile = new Parse.File(namePhoto+'.txt', {base64: base64data});
		parseFile.save().then(function() {
			// The file has been saved to Parse.
			console.log('el archivo fue guardado en parse con éxito');
			var Post = Parse.Object.extend("Post");
			post = new Post();
			post.set('file', parseFile);
			console.log(mediaName + mediaExt);
			post.set('media', mediaName + '.' + mediaExt);
			post.set('author', user);
			post.set('event', event);
			post.set('eventKey', data.eventName);
			console.log(data.coords);
			post.set('coords', data.coords);
			var point = new Parse.GeoPoint({latitude: data.coords.latitude, longitude: data.coords.longitude});
			post.set("location", point);
			post.save().then(function(newPost) {
				post.set('publicId', crip.enco(newPost.id));
				post.save();
				var parseFileURL = parseFile.url();
				//compartir foto en facebook
				if(data.shareOnFb) {
					shareMediaOnFb(req, parseFileURL, error);
				}
				postCount++;
				if(postCount >= postUpdate) {
					updateEventList();*/
		//Mongo
		/*Tag.findOne({name: simpleEventName}, function(err, tag) {
			var objectTag = tag;
			if(err) throw(err);
			console.log(coords);
			var action = new Action({
				name: data.eventName,
				geo: coords,
				media: mediaName + '.' + mediaExt,
				active: true,
				authorId: req.session.passport.user._id
			});
			action.save(function(err) {
				if(err) throw err;
				User.update({ _id: req.session.passport.user._id }, { $push: { actions: action._id }}, function (err, doc) {
					if (err) return handleError(err);
					console.log('accion referenciada a user');
					console.log(doc);
				});
				if(objectTag!= null) {
					objectTag.actions.push(action._id);
					objectTag.save();
					console.log('Acción referenciada a tag');
					next();
				} else {
					var tag = new Tag({
						name: simpleEventName,
						originalName: data.eventName,
						actions: action._id
					});
					tag.save(function (err) {
						if (err) return handleError(err);
						console.log('Tag guardado y acción referenciada');
						next();
					});
				}*/
/*				next();
			}, function(e) {
				 error(e);*/
			//});
/*		}, function(error) {
			console.log('error al guardar el archivo en parse');
			// The file either could not be read, or could not be saved to Parse.*/
		//});
	/*}, function(e) {
		error(e);
	});*/
}

/*
 * @descrip Comparte post en facebook si el botón de compartir fue activado a la hora de subir subir una foto
 * @par {string} data, {object} postFile, {function} next, {function} error.
 * @return null
 */ 
function shareMediaOnFb(req, url, error) {
	var albumId = '';
	FB.api('/' + albumId + '/photos','POST',
		{
			'url': url,
			'access_token': req.session.passport.user.accessToken
		},
			function (response) {
				if (response && !response.error) {
					// handle the result
					console.log('Foto compartida en facebook exitósamente');
				} else {
					error(e);
				}
			}
	);
}


/*
 * @descrip Compartir post en facebook
 * @par {string} data, {object} postFile, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.share = function(req, postFile, next, error) {
	var parseFileURL = postFile._url;
	var albumId = '';
	FB.api('/' + albumId + '/photos','POST',
		{
			'url': parseFileURL,
			'access_token': req.session.passport.user.accessToken
		},
			function (response) {
				if (response && !response.error) {
					// handle the result
					console.log('Foto compartida en facebook exitósamente');
					next();
				} else {
					error(e);
				}
			}
	);
}

/*
 * @descrip Cambia el idioma
 * @par {string} data, {object} data, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.changeLanguage = function(req, res, next, error) {
	var locale = req.body.language;
	if(locale == req.cookies.locale) {
		console.log('no cambio nada');
		next();
	} else {
		console.log('cambio de idioma exitoso');
		res.cookie('locale', locale, { maxAge: 1000*60*60*24*15, httpOnly: true });
		next();
	}
}

/*
 * @descrip Actualiza la lista de eventos más utilizados
 * @return null
 */

function updateEventList() {
	//var Post = Parse.Object.extend('Post');
	//var query = new Parse.Query(Post);
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
	next(data);
}

/*
 * @descrip Actualiza la asistencia de un usuario al evento
 * @param {boolean} join, {string} parseSessionToken, {string} eventId,
 * {function} next, {function} error.
 * @return null
 */
function updateEventAttendance(join, parseSessionToken, eventId, next, error) {
	/*Parse.User.become(parseSessionToken).then(function (user) {
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
	});*/
}

/* @descrip Método para obtener los 20 primeros posts de la BD con filtro como evento, autor, trend o sin filtro
 * @param {function} next, {function} error
 * @return null
 */
jPack.getAllPosts = function(req, next, error) {
	var posts = [];
	
	var Post = Parse.Object.extend('Post');
	
	var point = {};
	if(req.session.jUser.coords != undefined) {
		point.latitude = req.session.jUser.coords.latitude;
		point.longitude = req.session.jUser.coords.longitude;
	} else { // Arequipa
		point.latitude = -16.3989; 
		point.longitude = -71.535;
	}
	var userGeoPoint = new Parse.GeoPoint({latitude: point.latitude, longitude: point.longitude});

	var resultsLimit = 10;
	var queryNumber = 0;
	var queryTimeLimitStep = 24*20;

	if(req.params.i!=undefined) {
		queryNumber = parseInt(req.params.i);
	} else {
		req.session.queryTimeLimit = queryTimeLimitStep;
	}

	//console.log('Query Number: ' + queryNumber);

	countResults(0, findQuery, reCount, function(e) {
		error(e);
	});

	function countResults(tries, next, reCount, error) {
		getQuery(function(query) {
			//query.count().then(function(count) {
				if(query.length < resultsLimit * (queryNumber+1)) {
					req.session.queryTimeLimit = req.session.queryTimeLimit + queryTimeLimitStep;
					if (tries > 20) {
						console.log('Tiempo Agotado'); // TODO: Manejo de errores.
						next(query.length);
					} else {
						reCount(++tries);
					};
				} else {
					next(query.length);
				}
			/*}, function(e) {
				error(e);
			});*/
		}, function(e) {
			error(e);
		});

	}

	function findQuery(count) {
		//Parse.User.become(req.session.jUser.parseSessionToken).then(function (user) {
			getQuery(function(query) {
				//var relation = user.relation('likes');
				/*query.find().then(function(results) {
					console.log('Find Results: ' + results.length);*/
					if(query.length == 0) {
						next(query);
					}
					var c = query.length; //results.length;
					//relation.query().find().then(function(list) {
						// list contiene los posts que el usuario actual likeo
						for(var i in query) {
							//mongo
							posts[i] = {}; //console.log('action.author.name: ' + query[0].author[0].name);
							posts[i].id = query[i]._id;
							posts[i].fbId = '1400253030';//query[i].author[0].providerId;
							posts[i].authorId = query[i].authorId;
							posts[i].event = query[i].name;
							posts[i].time = query[i].createdAt;
							posts[i].media = query[i].media;
							//parse
							/*posts[i] = {}; //console.log('action.author.name: ' + query[0].author[0].name);
							posts[i].id = results[i].get('publicId');
							posts[i].fbId = crip.deco(results[i].get('author').get('username'));
							posts[i].event = results[i].get('eventKey');
							posts[i].time = results[i].createdAt;
							posts[i].file = results[i].get('file');
							posts[i].media = results[i].get('media');
							posts[i].timeTag = results[i].get('event').createdAt;	*/
							//posts[i].like = false;
							/*if (list.length == 0) {
								posts[i].like = false;
							} else {
								for(var j = 0; j<list.length; j++) {
									if(list[j].attributes.publicId == posts[i].id) {
										posts[i].like = true;
										break;
									} else {
										posts[i].like = false;
									}
								}
							}*/
							//mongo
							posts[i].location = {};
							posts[i].location.latitude = query[i].geo[0];
							posts[i].location.longitude = query[i].geo[1];
							getFBInfo(i, posts[i].fbId);
							//parse
							/*posts[i].location = {};
							posts[i].location.latitude = results[i].get('location').latitude;
							posts[i].location.longitude = results[i].get('location').longitude;
							getFBInfo(i, crip.deco(results[i].get('author').get('username'))); //getFBInfo(i,crip.deco(results[i].get('author').get('username')),results[i].get('author').get('idKey'));*/
						}
						function getFBInfo(i, fbUserId) { //function getFBInfo(i, fbUserId, idKey)
							FB.api('/'+fbUserId+'/', {access_token: req.session.passport.user.accessToken},  function(profile) {
								posts[i].author = {};
								//posts[i].author.idKey = idKey;
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
								var response = {posts: posts};
								next(response);
							}
						}
					/*}, function(e) {
						error(e);
					});
				}, function(e) {
					error(e);
				});*/
			}, function(e) {
				console.length('error');
			});
		/*}, function(e) {
			error(e);
		});*/
	}

	function reCount(tries) {
		countResults(tries, findQuery, reCount, error);
	}

	function getQuery(next, error) {
		var nowDate = new Date();
		var queryDate = new Date(nowDate - 1000 * 60 * 60 * req.session.queryTimeLimit);
		console.log(req.params);
		if(req.params.action == undefined) {
			Action.getActions(resultsLimit, queryNumber, function (err, actions) {
				next(actions);
			});
		} else if(req.params.action == 'event') {
			var tagName = simplifyName(req.params.id);
			Tag.getActionsByTag(tagName, function (err, tag) {
				next(tag.actions);
			});
		} else if(req.params.action == 'author') {
			User.getActionsByAuthor(req.params.id, function (err, author) {
				next(author.actions);
			});
		}
		/*Parse.User.become(req.session.jUser.parseSessionToken).then(function (user) {
			var nowDate = new Date();
			var queryDate = new Date(nowDate - 1000 * 60 * 60 * req.session.queryTimeLimit);
			var relation = user.relation('blockedUsers');
			relation.query().find().then(function(listOfBlockedUsers) {
				if(req.params.action == undefined) {
					// listOfBlockedUsers contiene los usuarios que el usuario actual bloqueó
					var query = new Parse.Query(Post);
					if(listOfBlockedUsers.length != 0) {
						query.notContainedIn('author', listOfBlockedUsers);
					}
					query.greaterThan('createdAt', queryDate);
					query.descending('createdAt');
					query.near('location', userGeoPoint);

					query.include('author');
					query.include('event');
					query.limit(resultsLimit);
					query.skip(resultsLimit * queryNumber);
					next(query);
				} else if(req.params.action == 'event') {
					var postQuery = new Parse.Query(Post);

					var postId = req.params.id;

					postQuery.include('event');
					postQuery.equalTo('publicId', postId);
					postQuery.find().then(function(post) {
						var postQuery2 = new Parse.Query(Post);
						if(listOfBlockedUsers.length != 0) {
							postQuery2.notContainedIn('author', listOfBlockedUsers);
						}
						postQuery2.descending('createdAt');
						postQuery2.include('author');
						postQuery2.include('event');
						postQuery2.limit(resultsLimit);
						postQuery2.skip(resultsLimit * queryNumber);
						postQuery2.equalTo('event', post[0].get('event'));
						next(postQuery2);
					}, function(e) {
						console.length('error');
						error(e);
					});
				} else if(req.params.action == 'author') {
					var User = Parse.Object.extend('User');
					var queryUser = new Parse.Query(User);
					var idKey = req.params.id;
					queryUser.equalTo('idKey', idKey);
					queryUser.find().then(function(userResult) {
						var postQuery = new Parse.Query(Post);
						if(listOfBlockedUsers.length != 0) {
							postQuery.notContainedIn('author', listOfBlockedUsers);
						}
						postQuery.descending('createdAt');
						postQuery.include('author');
						postQuery.include('event');
						postQuery.limit(resultsLimit);
						postQuery.skip(resultsLimit * queryNumber);
						postQuery.equalTo('author', userResult[0]);
						next(postQuery);
					}, function(e) {
						error(e);
					});
				} else if(req.params.action == 'trend') {
					var Event = Parse.Object.extend("Event");
					var eventQuery = new Parse.Query(Event);
					var postQuery = new Parse.Query(Post);
					var eventId = req.params.id;

					eventQuery.equalTo("objectId", eventId);
					eventQuery.find().then(function(chosenEvent) {
						if(listOfBlockedUsers.length != 0) {
							postQuery.notContainedIn('author', listOfBlockedUsers);
						}
						postQuery.descending('createdAt');
						postQuery.include('author');
						postQuery.include('event');
						postQuery.limit(resultsLimit);
						postQuery.skip(resultsLimit * queryNumber);
						postQuery.equalTo('event', chosenEvent[0]);
						next(postQuery);
					}, function(e) {
						error(e);
					});
				} else if(req.params.action == 'following') {
					var usersFollowed = [];
					var postQuery = new Parse.Query(Post);
					var Follow = Parse.Object.extend("Follow");
					var queryFollow = new Parse.Query(Follow);
					queryFollow.include('to');
					queryFollow.equalTo('from', user);
					queryFollow.find().then(function(users) {
						for(var i = 0; i<users.length; i++) {
							usersFollowed[i] = users[i].get("to");
						}
						if(listOfBlockedUsers.length != 0) {
							postQuery.notContainedIn('author', listOfBlockedUsers);
						}
						postQuery.descending('createdAt');
						postQuery.include('author');
						postQuery.include('event');
						postQuery.limit(resultsLimit);
						postQuery.skip(resultsLimit * queryNumber);
						postQuery.containedIn('author', usersFollowed);
						next(postQuery);
					}, function(e) {
						error(e);
					});
				}
			}, function(e) {
				error(e);
			});
		}, function(e) {
			error(e);
		});*/
	}
}

/*
 * @descrip Método para obtener los eventos en tendencia
 * @param {object} req, {function} next, {function} error
 * @return null
 */
jPack.getTrends = function(req, next, error) {
	Parse.User.become(req.session.jUser.parseSessionToken).then(function (user) {
		var events = [];
		var eventPost = [];
		var currentDate = new Date();
		var month = getMonthFormatted(currentDate.getMonth()+1);
		var date = getDateFormatted(currentDate.getDate());
		var hours = getHoursFormatted(currentDate.getHours());
		var minutes = getMinutesFormatted(currentDate.getMinutes());
		var seconds = getSecondsFormatted(currentDate.getSeconds());
		var milliseconds = getMillisecondsFormatted(currentDate.getMilliseconds());

		var relation = user.relation('blockedUsers');

		var currentDatetime = currentDate.getFullYear() + "-"
									+ month + "-"
									+ date + "T"
									+ hours + ":"
									+ minutes + ":"
									+ seconds + "."
									+ milliseconds + "Z";

		var limitDateTime = currentDate.getFullYear() + "-"
											+ getHoursFormatted(month-3) + "-"
											+ date + "T"  //getDateFormatted(date-3)
											+ hours + ":"
											+ minutes + ":"
											+ seconds + "."
											+ milliseconds + "Z";

		relation.query().find().then(function(listOfBlockedUsers) {
			var Post = Parse.Object.extend("Post");
			var postQuery = new Parse.Query(Post);
			var arrayEvents = [];
			if(listOfBlockedUsers.length != 0) {
				postQuery.notContainedIn('author', listOfBlockedUsers);
			}
			postQuery.include("event");
			postQuery.select("event");
			// TODO: Corregir error 102 'Invalid field type for find'
			//postQuery.lessThan("createdAt", currentDatetime);
			//postQuery.greaterThan("createdAt", limitDateTime);
			postQuery.find().then(function(results) {
				console.log("results.length: " + results.length);
				for (var i = 0; i < results.length; i++) {
					eventPost[i] = {};
					eventPost[i].id = results[i].attributes.event.id;
					eventPost[i].name = results[i].attributes.event.attributes.name;
					eventPost[i].count = 0;
					arrayEvents[i] = results[i].attributes.event.attributes.name;
				}

				var Event = Parse.Object.extend("Event");
				var eventQuery = new Parse.Query(Event);
				eventQuery.containedIn("name",arrayEvents);
				eventQuery.find().then(function(response) {
					console.log("response.length: " + response.length);
					for (var i = 0; i < response.length; i++) {
						events[i] = {};
						events[i].id = response[i].id;
						events[i].name = response[i].get("eventName");
						events[i].count = 0;
					}
					for (var i = 0; i < events.length; i++) {
						for (var j = 0; j < eventPost.length; j++) {
							if(events[i].id == eventPost[j].id) {
								events[i].count++;
							}
						}
					}
					//Ordenamiento burbuja en base al número de posts por cada evento
					for (var i = 0; i < events.length; i++) {
						for (var j = 0; j < events.length-1; j++) {
							if(events[j].count < events[j+1].count) {
								var aux  = events[j];
								events[j] = events[j+1];
								events[j+1] = aux;
							}
						}
					}
					var response = {trends: events};
					next(response);
				});
			}, function(e) {
				console.log('2016');
				error(e);
			});
		}, function(e) {
			error(e);
		});
		function getMonthFormatted (month) {
			return month < 10 ? '0' + month : month;
		}
		function getDateFormatted (date) {
			return date < 10 ? '0' + date : date;
		}
		function getHoursFormatted (hours) {
			return hours < 10 ? '0' + hours : hours;
		}
		function getMinutesFormatted (minutes) {
			return minutes < 10 ? '0' + minutes : minutes;
		}
		function getSecondsFormatted (seconds) {
			return seconds < 10 ? '0' + seconds : seconds;
		}
		function getMillisecondsFormatted (milliSeconds) {
			if(milliSeconds > 9 && milliSeconds < 99) {
				return '0' + milliSeconds;
			} if(milliSeconds < 10) {
				return '00' + milliSeconds;
			} else {
				return milliSeconds;
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
	console.log('getAllEvents');
	/*Parse.User.become(req.session.jUser.parseSessionToken).then(function (user) {
		var events = [];
		var Event = Parse.Object.extend('Event');
		var eventQuery = new Parse.Query(Event);
		eventQuery.ascending('name');
		eventQuery.find().then(function(response) {
			console.log('response.length: ' + response.length);
			for (var i = 0; i < response.length; i++) {
				events[i] = {};
				events[i].id = response[i].id;
				events[i].index = i;
				events[i].name = response[i].get('name');
			}
			var response = {events: events};
			next(response);
		});

	}, function(e) {
		error(e);
	});*/
}

/*D
 * @descrip Obtiene eventos sugeridos en ese momento y lugar, ademas de a través de 'queries'
 * @param {string} query, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.getSuggestedEvents = function(query, req, next, error) {
if(query != undefined) {
		Parse.User.become(this.parseSessionToken).then(function (user) {
			var point = {};
			// TODO: Globalizar la elección del punto GPS
			if(req.session.jUser.coords != undefined) {
				point.latitude = req.session.jUser.coords.latitude;
				point.longitude = req.session.jUser.coords.longitude;
			} else { // Arequipa
				point.latitude = -16.3989; 
				point.longitude = -71.535;
			}
			var userGeoPoint = new Parse.GeoPoint({latitude: point.latitude, longitude: point.longitude});
			var Post = Parse.Object.extend("Post");
			var eventQuery = new Parse.Query(Post);
			eventQuery.select('eventKey');
			eventQuery.withinKilometers('location', userGeoPoint, 3);
			eventQuery.limit(100);
			eventQuery.find().then(function(posts) {
				var suggestedEvents = [];
				for( var i in posts ) {
					suggestedEvents[i] = {};
					suggestedEvents[i].name = posts[i].get('eventKey');
					suggestedEvents[i].distance = parseInt(i);
					suggestedEvents[i].count = 1;
					suggestedEvents[i].value = 1;
				};

				var suggestedEventsSorted = [];
				var eventCount = suggestedEvents.length;

				for( var i in suggestedEvents) {
					countDuplicate(suggestedEvents[i]);
				};

				function countDuplicate(suggestedEvent) {
					var finded = false;
					for (var i = 0; i < suggestedEventsSorted.length; i++) {
						if(suggestedEventsSorted[i].name == suggestedEvent.name) {
							finded = true;
							suggestedEventsSorted[i].count++;
							if(suggestedEvent.distance < suggestedEventsSorted[i].closestDistance) {
								suggestedEventsSorted[i].closestDistance = suggestedEvent.distance;
							}
							suggestedEventsSorted[i].groupDispertion = (suggestedEventsSorted[i].groupDispertion + (suggestedEvent.distance - suggestedEventsSorted[i].lastDistance - 1))/2;
							suggestedEventsSorted[i].lastDistance = suggestedEvent.distance;
							suggestedEventsSorted[i].value = setValue(suggestedEventsSorted[i]);
						}
					}
					if(!finded) {
						var i = suggestedEventsSorted.length;
						suggestedEventsSorted[i] = {}
						suggestedEventsSorted[i].name = suggestedEvent.name;
						suggestedEventsSorted[i].count = 1;
						suggestedEventsSorted[i].lastDistance = suggestedEvent.distance;
						suggestedEventsSorted[i].closestDistance = suggestedEvent.distance;
						suggestedEventsSorted[i].groupDispertion = 0;
						suggestedEventsSorted[i].value = setValue(suggestedEventsSorted[i]);
					}
				}

				function setValue(suggestedEvent) {
					return (1-(suggestedEvent.closestDistance / eventCount)) * 0.6 +
						(suggestedEvent.count / eventCount) * 0.4;
				}

				suggestedEventsSorted.sort( function(a,b) {
					if (a.value > b.value)
						return -1;
					if (a.value < b.value)
				 		return 1;
					return 0;
				});

				next(suggestedEventsSorted.slice(0,3));
			}, function(e) {
				error(e);
			});
		}, function(e) {
			error(e);
		});
	} else {
		
	}
}

jPack.stadistics = function () {
}

/*
 * @descrip Función para revisar la carga de la aplicación
 */

// TODO: Evaluar
var job = new CronJob('*/30 * * * * *', function() {
	//console.log(postCount);
}, function () {
	// This function is executed when the job stops
},
	true /* Start the job right now *//*,
	timeZone /* Time zone of this job. */
);

module.exports = jPack;

