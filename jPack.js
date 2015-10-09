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
	var pattern = /[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]*\w[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+/; // var pattern = /@[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]*\w[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+/;
	var flag = validate({post: newPost.eventName}, {post: {format: pattern}});
	//console.log(flag);
	if(flag!=undefined) {
		console.log("ERROR!! AL INSERTAR NOMBRE DE EVENTO");
		next();
	} else {
		Parse.User.become(this.parseSessionToken).then(function (user) {
			console.log('J1');
			var Event = Parse.Object.extend("Event");
			var query = new Parse.Query(Event);
			//var str = newPost.eventName;
			//var res= str.split("@");
			//var newPostEventName = res[1];
			//console.log("RES!!!!!!!!!!!!!!!! SPLIT");
			//console.log( newPost.eventName);
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
}

/*D
 * @descrip Asigna relación de like con el post clickeado
 * @param {object} post, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.setLike = function(post, next, error) {
	//console.log('J0 - ' + this.parseSessionToken);
	Parse.User.become(this.parseSessionToken).then(function (user) {
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
	});
}

/*D
 * @descrip Remueve relación de like con el post clickeado
 * @param {object} newPost, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.setUnlike = function(post, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
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
	});
}

/*D
 * @descrip Crea la relación de seguir a una persona 
 * @param {object} userToFollow, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.setFollowRelation = function(userToFollow, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var Follow = Parse.Object.extend("Follow");
		follow = new Follow();
		var queryUser = new Parse.Query(User);
		//var relation = user.relation("following");
		if(userToFollow.username != undefined) {
			queryUser.equalTo("username", userToFollow.username);
			queryUser.find().then(function(userFollowed) {
				follow.set("from", user);//También puede usarse Parse.User.current() en vez de 'user', objeto del usuario actual
				follow.set("to", userFollowed[0]);//objecto del usuario a seguir
				follow.set("date", Date());
				follow.save();
				/*relation.add(results[0]);
				user.save();*/
				console.log("Empezaste a seguir a " + userToFollow.firstName);
				next();
			}, function(e) {
				error(e);
			});
		}
	}, function(e) {
		error(e);
	});
}

/*D
 * @descrip Deshace la relación de seguir a una persona 
 * @param {object} userToFollow, {function} next, {function} error.
 * @return null
 */
jPack.user.prototype.setUnFollowRelation = function(userToFollow, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var Follow = Parse.Object.extend("Follow");
		var queryUser = new Parse.Query(User);
		var relationObjectId= ""; //Este es el objectId de la relación a eliminar
		//var relation = user.relation("following");
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
				/*relation.remove(results[0]);
				user.save();*/
			}, function(e) {
				error(e);
			});
		}
	}, function(e) {
		error(e);
	});
}

/*D
 * @descrip Obtiene todas las personas que siguen al usuario actual
 * @param {object} req, {function} next, {function} error.
 * @return {array} followers
 */
jPack.user.prototype.getFollowers = function(req, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
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
				for(var i = 0; i<users.length; i++) {
					var userResult = users[i];
					var columnTo = userResult.get("from");
					var fbUserId = crip.deco(columnTo.get("username"));
					var date = userResult.get("date");
					getFBInfo(i, fbUserId);
				}
				function getFBInfo(i, fbUserId) {
					FB.api('/'+fbUserId+'/', {access_token: req.session.jUser.accessToken},  function(profile) {
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
						next();
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
	});
}

/*D
 * @descrip Obiene todas las personas que el usuario actual está siguiendo
 * @param {object} req, {function} next, {function} error.
 * @return {array} following
 */
jPack.user.prototype.getFollowing = function(req, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
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
						FB.api('/'+fbUserId+'/', {access_token: req.session.jUser.accessToken},  function(profile) {
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
	});
}

/*D
 * @descrip Obtiene los amigos de facebook que están usando la aplicación 
 * @param {object} req, {function} next, {function} error.
 * @return {array} usingIds
 */
jPack.user.prototype.getFriendsUsingApp = function(req, next, error) {
	var idProfile = req.session.passport.user.id;
	var friendsUsing = [];
	var aux = 0; //variable que controla si ya asignó el atributo following a todos los usuarios
	Parse.User.become(this.parseSessionToken).then(function (user) {
		//var User = Parse.Object.extend("User"); //TODO: ver si es necesario, sino borrarla
		// list contains the users that the current user is following.
		FB.api('/'+idProfile+'/friends',{fields: 'installed, name',  access_token: req.session.jUser.accessToken}, function(response) {
			if (response && !response.error) {
				//console.log(response.data);
				for(var i = 0; i<response.data.length; i++) {
					if(response.data[i].installed == true && response.data[i].id != idProfile) {
						friendsUsing[i] = {};
						friendsUsing[i].installed = response.data[i].installed;
						friendsUsing[i].name = response.data[i].name;
						//friendsUsing[i].id = response.data[i].id;
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
	});
}

/*D
 * @descrip Obtiene los amigos de facebook que están usando la aplicación 
 * @param {object} req, {function} next, {function} error.
 * @return {array} usingIds
 */
jPack.user.prototype.getAllUsers = function(req, next, error) {
	var idProfile = req.session.passport.user.id;
	var allUsers = [];
	var aux = 0; //variable que controla si ya asignó el atributo following a todos los usuarios
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var User = Parse.Object.extend("User");
		var relation = user.relation("blockedUsers");
		var queryUser = new Parse.Query(User);
		queryUser.notEqualTo("objectId", user.id);
		queryUser.find().then(function(users) {
			relation.query().find().then(function(listOfBlockedUsers) {
			//listOfBlockedUsers contains the users that the current user blocked.
				for(var i = 0; i<users.length; i++) {
						allUsers[i] = {};
						allUsers[i].username = users[i].attributes.username;
						getFBInfo(i, crip.deco(users[i].attributes.username));
				}
				function getFBInfo(i, fbUserId) {
					FB.api('/'+fbUserId+'/', {access_token: req.session.jUser.accessToken},  function(profile) {
						allUsers[i].firstName = profile.first_name;
						allUsers[i].lastName = profile.last_name;
						FB.api('/'+fbUserId+'/picture?redirect=0&height=200&type=normal&width=200',  function(picture) {
							allUsers[i].picture= picture.data.url;
							if (listOfBlockedUsers.length == 0) {
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
									next(allUsers);
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
	});
}

/*D
 * @descrip Asigna relación de bloqueo
 * @param {object} userToBlock, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.blockUser = function(userToBlock, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
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
	});
}

/*D
 * @descrip Remueve relación de bloqueo
 * @param {object} userToBlock, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.unBlockUser = function(userToBlock, next, error) {
	console.log("unBlockUser!");
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
	});
}

/*
 * @descrip Establece la información de genérica del usuario.
 * @par {obj} data, {function} next, {function} error.
 * @return null
 */ 
jPack.user.prototype.setGenericData = function(req, next, error) {
	this.coords = req.body.data.coords;
	req.session.jUser.coords = this.coords;
	next();
	/*this.setFollowRelation(req.body.peopleToFollow, function(){
		next();
	},function(){
	});*/
}

/*
 * @descrip Guarda el post y establece las relaciones
 * @par {string} data, {object} user, {object} event, {function} next, {function} error.
 * @return null
 */ 
function savePost(data, user, event, next, error) {
	var mediaName = parseInt(Math.random(255,2)*10000);
	var mediaExt = 'jpg';
	saveMedia(data.media, mediaName, mediaExt, function(imgBase64) {
		var base64data = imgBase64;
		var namePhoto = mediaName;
		var parseFile = new Parse.File(namePhoto+".txt", {base64: base64data});
		parseFile.save().then(function() {
			// The file has been saved to Parse.
			console.log("el archivo fue guardado en parse con éxito");
			var Post = Parse.Object.extend("Post");
			post = new Post();
			post.set("file", parseFile);
			console.log(mediaName + mediaExt);
			post.set('media', mediaName + '.' + mediaExt);
			post.set('author', user);
			post.set('event', event);
			console.log(data.coords);
			post.set('coords', data.coords);
			var point = new Parse.GeoPoint({latitude: data.coords.latitude, longitude: data.coords.longitude});
			post.set("location", point);
			post.save().then(function(newPost) {
				post.set('publicId', crip.enco(newPost.id));
				post.save();
				postCount++;
				if(postCount >= postUpdate) {
					updateEventList();
				}
				next();
			}, function(e) {
				error(e);
			});
		}, function(error) {
			console.log("error al guardar el archivo en parse");
			// The file either could not be read, or could not be saved to Parse.
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
	next(data);
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


/* @descrip Método para obtener los 15 primeros post de la BD y número de amigos que van a un evento
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

	var resultsLimit = 20;
	var queryNumber = 0;
	var queryTimeLimitStep = 24*20;

	if(req.params.postQueryCount!=undefined) {
		queryNumber = parseInt(req.params.postQueryCount);
	} else {
		req.session.queryTimeLimit = queryTimeLimitStep;
	}

	//console.log('Query Number: ' + queryNumber);

	countResults(0, findQuery, reCount, function(e) {
		error(e);
	});

	function countResults(tries, next, reCount, error) {
		var query = getQuery();

		query.count().then(function(count) {
			//console.log('Count: ' +  count + ' Required: ' + resultsLimit * (queryNumber+1));
			if(count < resultsLimit * (queryNumber+1)) {
				req.session.queryTimeLimit = req.session.queryTimeLimit + queryTimeLimitStep;
				if (tries > 20) {
					console.log('Tiempo Agotado'); // TODO: Manejo de errores.
					next(count);
				} else {
					//console.log('Tries: ' + tries);
					reCount(++tries);
				};
			} else {
				next(count);
			}
		}, function(e) {
			error(e);
		});
	}

	function findQuery(count) {
		Parse.User.become(req.session.jUser.parseSessionToken).then(function (user) {
			var query = getQuery();
			var relation = user.relation("likes");
			query.find().then(function(results) {
				console.log('Find Results: ' + results.length);
				if(results.length == 0) {
					next(results);
				}
				var c = results.length;
				relation.query().find().then(function(list) {
					// list contains the posts that the current user likes.
					//console.log(list);
					//console.log(list[0]._serverData.media);
				
					for(var i in results) {
						//console.log(results[i].get('media'));
						posts[i] = {};
						//posts[i].media = results[i].get('media'); // método antiguo utilizado por public/uploads
						posts[i].id = results[i].get('publicId');
						posts[i].event = results[i].get('event').get('name');
						posts[i].time = results[i].createdAt;
						posts[i].file = results[i].get('file');
						posts[i].media = posts[i].file.url(); //posts[i].file.url
						if (list.length == 0) {
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
						}
						//
						posts[i].location = {};
						posts[i].location.latitude = results[i].get('location').latitude;
						posts[i].location.longitude = results[i].get('location').longitude;
						//
						getFBInfo(i,crip.deco(results[i].get('author').get('username')));
					}
					function getFBInfo(i, fbUserId) {
						FB.api('/'+fbUserId+'/', {access_token: req.session.jUser.accessToken},  function(profile) {
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
							//getNumberOfFriendsAttendingEvent();
							var response = {posts: posts};//, attendingEvents: attendingEvents};
							next(response);
						}
					}
				}, function(e) {
					error(e);
				});

		/*
				function getNumberOfFriendsAttendingEvent() {
					var attendingEvents = [];
					var arrayOfUserIds = [];
					Parse.User.become(this.parseSessionToken).then(function (user) {
						var User = Parse.Object.extend("User");
						var userQuery = new Parse.Query(User);

						userQuery.notEqualTo("objectId", user.id);
						var Post = Parse.Object.extend("Post");
						var postQuery = new Parse.Query(Post);
						postQuery.include("author");
						postQuery.include("event");

						postQuery.matchesQuery('author', userQuery);
						postQuery.find().then(function(results) {
							var c = results.length;
							for(var i in results) {
								attendingEvents[i] = {};
								var aux = addNumberOfFriendsInEachEvent(results[i].get('event').get('name'), crip.deco(results[i].get('author').get('username')), results[i].get('author').get('userId'), i);
								arrayOfUserIds[i] = results[i].get('author').get('userId');
								if(!aux) {
									triggerNext();
								}
							}

							function addNumberOfFriendsInEachEvent(name, fbUserId, userId, i) {
								var index = -1;
								for(var j in attendingEvents) {
									if(attendingEvents[j].name == name) {
										index = j;
										break;
									}
								}
								if(index >= 0) {
									var flag = 0;
									var currentAuthor = results[i].get('author').get('userId');
									for(var k=0; k<=attendingEvents.length; k++) {
										if(currentAuthor == arrayOfUserIds[k]) { 
											return 0;
										} else {
											attendingEvents[index].count++;
											FB.api('/'+fbUserId+'/',  function(profile) {
												var n = 1;
												var aux = 1;
												do {
													if(attendingEvents[index].going[n] != "") {
														attendingEvents[index].going[n] = {};
														attendingEvents[index].going[n].userId = userId;
														attendingEvents[index].going[n].firstName = profile.first_name;
														attendingEvents[index].going[n].lastName = profile.last_name;
														triggerNext();
														aux = 0;
													}
													n++;
												} while(aux);
											});
											return 1;
										}
									}
								} else {
									attendingEvents[i] = {name: name, count: 1};
									FB.api('/'+fbUserId+'/',  function(profile) {
										attendingEvents[i].going = [];
										attendingEvents[i].going[0] = {};
										attendingEvents[i].going[0].userId = userId;
										attendingEvents[i].going[0].firstName = profile.first_name;
										attendingEvents[i].going[0].lastName = profile.last_name;
										triggerNext();
									});
									return 1;
								}
							}
							function triggerNext() {
								c--;
								if(c===0) {
									var response = {posts: posts, events: events, attendingEvents: attendingEvents};
									next(response);
								}
							}
						});
					});
				}*/
			}, function(e) {
				error(e);
			});
		}, function(e) {
			error(e);
		});
	}

	function reCount(tries) {
		countResults(tries, findQuery, reCount, error);
	}

	function getQuery() {
		var query = new Parse.Query(Post);
		var nowDate = new Date();
		var queryDate = new Date(nowDate - 1000 * 60 * 60 * req.session.queryTimeLimit);
		//console.log('Días atras: ' + req.session.queryTimeLimit/24);

		query.greaterThan('createdAt', queryDate);
		query.descending('createdAt');
		//query.withinKilometers('location', userGeoPoint, 1);
		query.near('location', userGeoPoint);
		
		query.include('author');
		query.include('event');
		query.limit(resultsLimit);
		//console.log('Skip Number: ' + (resultsLimit * queryNumber));
		query.skip(resultsLimit * queryNumber);

		return query;		
	}
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
	var events = [];
	var eventPost = [];
	var currentDate = new Date();
	var month = getMonthFormatted(currentDate.getMonth()+1);
	var date = getDateFormatted(currentDate.getDate());
	var hours = getHoursFormatted(currentDate.getHours()+5); //le sumo 5 por el time zone de perú
	var minutes = getMinutesFormatted(currentDate.getMinutes());
	var seconds = getSecondsFormatted(currentDate.getSeconds());
	var milliseconds = getMillisecondsFormatted(currentDate.getMilliseconds());

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

	var Post = Parse.Object.extend("Post");
	var postQuery = new Parse.Query(Post);
	var arrayEvents = [];
	postQuery.include("event");
	postQuery.select("event");
	postQuery.lessThan("createdAt", currentDatetime);
	postQuery.greaterThan("createdAt", limitDateTime);

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
				events[i].name = response[i].get("name");
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
			var response = {events: events};
			next(response);
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
	//});

	
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

/*D
 * @descrip Envía push notification, pide tu ubicación
 * @param {object} postToAskLocationId, {function} next, {function} error.
 * @return null
*/
jPack.user.prototype.askLocation = function(postToAskLocationId, next, error) {
	Parse.User.become(this.parseSessionToken).then(function (user) {
		var installationQuery = new Parse.Query(Parse.Installation);
		var Post = Parse.Object.extend("Post");
		var postQuery = new Parse.Query(Post);
		var userToSendNotification;

		postQuery.include("author");
		postQuery.equalTo("publicId", postToAskLocationId);
		postQuery.find().then(function(userToAsk) {
			if(userToAsk.length != 0) {
				userToSendNotification = userToAsk[0].get("author");
				sendNotification(userToSendNotification, next, error);
			} else {
				console.log("error");
				next();
			}
		}, function(e) {
			error(e);
		});

		data = {
      "alert": "Rodrigo pidió tu ubicación!!!.",
      "sound": "cheering.caf" // default ios sound.
    };

		function sendNotification(userToSendNotification, next, error) {
			installationQuery.equalTo("user", userToSendNotification);
			//installationQuery.equalTo('deviceToken', '9e69945890218f9be34edf1ff3524d6627669ab656b734cb67df73556d2f68e8');
			Parse.Push.send({
				where: installationQuery, // Set our Installation query
				data: data
			}, {
				success: function() {
					// Push was successful
					console.log("push notification enviada con éxito");
					next();
				},
				error: function(error) {
					// Handle error
					console.log("Error! al enviar notificación");
					error();
				}
			});
		}
	}, function(e) {
		error(e);
	});
}

// TODO: Evaluar remoción
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
