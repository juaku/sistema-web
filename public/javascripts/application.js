// 	/*
// 	 * Framework socket.io
// 	 */
// 	/*var socket = io();
// 	socket.on('newEvent', function() {
// 		$scope.showEvents();
// 	});
// 	*/
// }

var EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

$(function() {
    FastClick.attach(document.getElementById('box'));
});

//
//	Código de maquetación
//

$('#share-new-post .share').on('click', function() {
	$(this).toggleClass('selected');
});

$('input.event-name').on('focus', function() {
	$('body').addClass('view-menu-hidden');
});
$('input.event-name').on('focusout', function() {
	$('body').removeClass('view-menu-hidden');
});

function actionsLoaded() {
	$('.save').off('click');
	$('.save').on('click', function(event) {
		$('body').toggleClass('dark');
	});

	// Parpadeo cuando se hace scroll hacia abajo
	//
	$('article .media img').off('click');
	$('article .media img').on('click', function() { 
		assistedScroll(1, $(this).parents('article'));
	});
	$('.author-hex-code').each(function(index) {
		$(this).css('background-color', '#' + $(this).attr('hex-code'));
	});

	// Restringe el uso de espacios, @ y cualquier otro caracter que no esté en la expresión regular al escribir el nombre del evento
	//
	$(".event-name").bind('keypress', function(event) {
		var regex = new RegExp("[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+");
		var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
		if (!regex.test(key)) {
			event.preventDefault();
		}
	});
}

$(document).scroll(function() {
	checkScroll('body');
});

var gettingPosts = false;
var sendingPost = false;
var queryStart = 0;
var numEmptyPosts = 0;

function checkScroll(target) {
	if($(target).scrollTop()*1.5 >= $(target).prop('scrollHeight') && !gettingPosts) {
		app.router();
	}
}

Vue.directive('novetwo', function (el, binding) {
  console.log(el,binding);
})

var app = new Vue({
	el: '#box',
	data: {
		route: null,
		posts: createEmptyPosts(3),
		newPost: {}
	},
	http: {
		headers: {
			Authorization: 'Bearer ' + token
		}
	},
	methods: {
		router: function(route, event) {
			if(event) {
				event.preventDefault();
			}
			gettingPosts = true;

			var newRoute = route;
			var pushToHistory = false;
			if(route == undefined) {
				queryStart++;
				var emptyPosts = createEmptyPosts(1);
				for(post in emptyPosts) {
					this.posts.push(emptyPosts[post]);
				}
				newRoute = this.route;
			} else {
				queryStart = 0;
				this.posts = createEmptyPosts(3);
				var scrollTo = 0;
				if(route != '') {
					scrollTo = $("article").first().offset().top;
				}
				$(document).scrollTop(scrollTo);
				$('main').scrollTop(scrollTo);
				if(this.route == null) {
					pushToHistory =  false;
				} else {
					pushToHistory =  true;
				}
				newRoute = route;
			}

			this.route = newRoute;

			this.refresh(newRoute, function() {
				var state = {
					'posts': app.posts,
					'route': app.route,
					'queryStart': queryStart};
				if(pushToHistory) {
					history.pushState(state, null, app.route);
				} else {
					history.replaceState(state,null, app.route);
				}
				gettingPosts = false;
			}, function(e) {
			});
		},
		loaded: function(action) {
			if(action.media != EMPTY_IMAGE) {
				action.class = 'loaded';
			}
		},
		refresh: function(route, next, error) {
			query(route, function (data) {
				if(data) {
					for (var i = 0; i < data.length; i++) {
						var aux = data[i];
						aux.class = '';
						aux.tools = false;
						aux.timeFromNow = moment(data[i].time).fromNow();
						if(numEmptyPosts > 0) {
							Vue.set(app.posts, app.posts.length - numEmptyPosts, aux);
							numEmptyPosts--;
						} else {
							app.posts.push(aux);
						}
					}
				}
				
				while(numEmptyPosts > 0) {
					app.posts.pop();
					numEmptyPosts--;
				}
				next();
			}, function(e) {
				window.location = '/logout'; // TODO: ¿Qué hacer con estos errores?
				error();
			});
		},
		reload: function() {
			window.location = '/';
		},

		scroll: function() {
			checkScroll('main');
		},
		take: function() {
			$('body').addClass('new-post-view');
			$('input#media-loader').click();
		},
		sendNewPost: function(event, error) {
			event.preventDefault();
			if(!sendingPost) {
				sendingPost = true;
				this.$http.post('/post/new', this.newPost).then(function(data) {
					sendingPost = false;
				}, function(res)  {
					error();
				});
			}
		},
		assistedScroll: function(event) {
			var elements = 'body, main';
			$(document.body).stop().animate({
				'scrollTop': $(event.target).parents('article').next().offset().top
			}, 200, 'swing', function () {
				//window.location.hash = refPost; TODO: Actualizar hash
			});
		},
		updateState: function(state) {
			if(!state)
				return;
			this.route = state.route;
			queryStart = state.queryStart;
			this.posts = [];
			for(post in state.posts) {
				state.posts[post].class = 'loaded'; // Hack de error Vue.js en popstate
				this.posts.push(state.posts[post]);
			}
		},
		toggleSavePost: function(post) {
			if (!post.saved) {
	 			post.saved = true;
	 			console.log(post);
	 			this.$http.post('/post/save', post).then(function(data) {
	 			},function(e) {
	 			});
	 		} else {
	 			post.saved = false;
	 			console.log(post);
	 			this.$http.post('/post/unsave', post).then(function(data) {
	 			},function(e) {
	 			});
	 		}
		},
		setNewMedia: function(event) {
			var canvas = document.getElementById('new-media-preview');
			var ctx = canvas.getContext('2d');

			EXIF.getData(event.target.files[0], function() {
				var orientation = this.exifdata.Orientation;
				var reader = new FileReader();
				reader.onload = function(event) {
					var img = new Image();
					img.onload = function() {
						var nTam = 880;
						canvas.width = nTam;
						canvas.height = nTam;
						var nWidth = nTam;
						var nHeight = nTam;
						var variation = {a: 0, desX: 0, desY: 0, cntX: -1, cntY: 0, swt:false};
						if(img.width > img.height) {
							nWidth = img.width * nTam / img.height;
						} else if(img.width < img.height) {
							nHeight = img.height * nTam / img.width;
							variation = {a: 0, desX: 0, desY: 0, cntX: 0, cntY: -1, swt:false};
						}

						switch(orientation) {
							case 3:
								variation = {a: 180, desX: -1, desY: -1, cntX: 1, cntY: 0, swt:false};
								break;
							case 6:
								variation = {a: 90, desX: 0, desY: -1, cntX: -1, cntY: 0, swt:true};
								break;
							case 8:
								variation = {a: -90, desX: -1, desY: 0, cntX: 1, cntY: 0, swt:true};
								break;
						}
						
						variation.width = nWidth;
						variation.height = nHeight;
						if(variation.swt) {
							variation.width = nHeight;
							variation.height = nWidth;
						}
						var cntVar = 0;
						if (variation.width > nTam) {
							cntVar = parseInt((variation.width - nTam)/2);
						} 
						if (variation.height > nTam) {
							cntVar = parseInt((variation.height - nTam)/2);
						}
						var xPoint = (nWidth*variation.desX) + cntVar*variation.cntX;
						var yPoint = (nHeight*variation.desY) + cntVar*variation.cntY;
						ctx.rotate(variation.a*Math.PI/180);
						ctx.drawImage(img,xPoint,yPoint,nWidth,nHeight);
						var mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )?true:false;
						var imgQuality = mobile?0.5:0.75;
						var newImg = canvas.toDataURL( 'image/jpeg' , imgQuality );

						//getGeo( function() {
						//	$('#positionMap img').attr('src','http://maps.googleapis.com/maps/api/staticmap?zoom=15&size=500x100&markers=color:red|' + $scope.newAction.coords.latitude + ',' + $scope.newAction.coords.longitude);
						//}, function(errorMsg) {
						//	console.log(errorMsg);
						//});
						app.newPost.media = newImg;
					}
					img.src = event.target.result;
				}
				reader.readAsDataURL(event.target.files[0]);
			});
		},
		back: function() {
			history.back();
		}
	}
});

function query(route, next, error) {
	app.$http.get('/list/' + [route, queryStart].join('/')).then(function(res) {
		next(res.body.posts);
	}, function(res)  {
		error(res);
	});
}

function createEmptyPosts(n) {
	var emptyPosts = []
	numEmptyPosts = n;
	for (var i = 0; i < n; i++) {
		emptyPosts[i] = {
			'media': EMPTY_IMAGE,
			'event':'',
			'time':'',
			'class':'',
			'author':{
				'firstName':'',
				'lastName':'',
				'picture': EMPTY_IMAGE
			},
		};
	}
	return emptyPosts;
}

app.router(window.location.pathname.substring(1));

if ('serviceWorker' in navigator) {
	console.log('CLIENT: service worker registration in progress.');
	navigator.serviceWorker.register('/service-worker.js').then(function() {
		console.log('CLIENT: service worker registration complete.');
	}, function() {
		console.log('CLIENT: service worker registration failure.');
	});
} else {
	console.log('CLIENT: service worker is not supported.');
}

//
// Framework Angular
//

//app.user = {};
//app.user.data = {};

// function Application($scope, $http, $window) {
// 	// Modelo User
// 	//
// 	$scope.modifyTag = function(action) {
// 		action.editing = true;
// 		$scope.oldTag = action.tag;
// 	}
// 	$scope.updateTag = function(action) {
// 		action.oldTag = $scope.oldTag;
// 		action.editing = true;
// 		$http.post('/post/editTag', action).success(function() {
// 		}).error();
// 	}
// 	$scope.deleteAction = function(post) {
// 		$scope.post = post;
// 		$http.post('/post/deleteAction', $scope.post).success(function(data) {
// 		}).error();
// 	}
// 	// Guarda la foto
//
// 	$scope.reportAction = function (post) {
// 		$scope.post = post;
// 		$http.post('/post/reportAction', $scope.post).success(function(data) {
// 		}).error();
// 	}
// 	// Envía un objeto con los datos del usuario que se desea bloquear o desbloquear mediante un post
// 	//
// 	$scope.blockUser = function(userToBlock) {
// 		$scope.user.userToBlock = userToBlock;
// 		if (!$scope.user.userToBlock.block) {
// 			$scope.user.userToBlock.block = true;
// 			$http.post('/user/block', $scope.user).success(function(data) {
// 			}).error();
// 		} else {
// 			$scope.user.userToBlock.block = false;
// 			$http.post('/user/unBlock', $scope.user).success(function(data) {
// 			}).error();
// 		}
// 	}
// 	// Post
// 	// 
// 	$scope.newAction = {};
// 	$scope.newAction.shareOnFb = false;
// 	$scope.shareOnFb = function() {
// 		$scope.newAction.shareOnFb = !$scope.newAction.shareOnFb;
// 	}
// 	$scope.shareActionOnFb = function(post) {
// 		$scope.post = post.media;
// 		$http.post('/post/shareActionOnFb', $scope.post).success(function(data) {
// 		}).error();
// 	}
// 	$scope.changeLanguage = function(language) {
// 		$scope.user.language = language;
// 		$http.post('/user/change-language', $scope.user).success(function(data) {
// 		}).error();
// 	}
// $scope.sendNewAction = function() {// TODO: Evaluar riesgo de ataque, Crear post para form Multi - Riesgo de ataque
// 	var createForm = new FormData();
// 	for (key in $scope.newAction) {
// 		createForm.append(key, $scope.newAction[key]);
// 	}
// 	$http.post('/post', createForm, {
// 		withCredentials: true,
// 		headers: {'Content-Type': undefined },
// 		transformRequest: angular.identity
// 	}).success(function(data) {
// 	}).error();
// }
// 	// Geo
// 	//
// 	function getGeo(next, error) {
// 		if (navigator.geolocation) {
// 			var position = 0;
// 			next(); 
// 			// TODO: HTTPS
// 			/*			
// 			navigator.geolocation.getCurrentPosition(function(position) {
// 				var coords = {};
// 				coords.accuracy = position.coords.accuracy;
// 				coords.altitude = position.coords.altitude;
// 				coords.altitudeAccuracy = position.coords.altitudeAccuracy;
// 				coords.heading = position.coords.heading;
// 				coords.latitude = position.coords.latitude;
// 				coords.longitude = position.coords.longitude;
// 				coords.speed = position.coords.speed;
// 				$scope.user.data.coords = coords;
// 				$scope.newAction.coords = coords;
// 				console.log('coords: ' + coords.latitude);
// 				next(); 
// 			}, function(errorObj) {
// 				var errorMsg = "";
// 				switch(errorObj.code) {
// 					case errorObj.PERMISSION_DENIED:
// 						errorMsg = "User denied the request for Geolocation."
// 						break;
// 					case errorObj.POSITION_UNAVAILABLE:
// 						errorMsg = "Location information is unavailable."
// 						break;
// 					case errorObj.TIMEOUT:
// 						errorMsg = "The request to get user location timed out."
// 						break;
// 					case errorObj.UNKNOWN_ERROR:
// 						errorMsg = "An unknown error occurred."
// 						break;
// 				}
// 				// TODO: Manejar error 
// 				alert('Mal! ' + errorMsg);
// 				error(errorMsg);
// 			});
// 			*/
// 		} else {
// 			error("Geolocation is not supported by this browser.");
// 		}
// 	}
// }

// .filter('capitalize', function() {
// 	return function(input) {
// 		return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
// 	}
// })

// /*if(window.innerHeight > window.innerWidth){
//     document.getElementsByTagName("body").style.transform = "rotate(90deg)";
// }*/

window.onpopstate = function(event) {
	app.updateState(event.state);
};