// 	/*
// 	 * Framework socket.io
// 	 */
// 	/*var socket = io();
// 	socket.on('newEvent', function() {
// 		$scope.showEvents();
// 	});
// 	*/
// }

/*
 * Código de maquetación
 * ---------------------
 */
$(document).ready(function() {
	$('main').scrollLeft($('#first').width());

	/*
	 * Evitar que se ejecute clicks fuera del area del logotipo
	 *
	 */
	 var clickInsideIcon = false;
	$('#title a').on('click tapone', function(event){
		if(!clickInsideIcon) {
			event.preventDefault();
			clickInsideIcon = false;
		}
	});

	$('#title a #logo-icon').on('click tapone', function(event){
		clickInsideIcon = true;
		$('#title a').click();
	});

	/*
	 * Cambiar de tema
	 *
	 */
	$('#title img').on('tapone', function(event) {
		console.log(event.target);
		$('body').toggleClass('dark');
	});

	//

	$('#view-menu .button').on('tapone', function() {
		$('#view-menu .button').removeClass('selected');
		$(this).addClass('selected');
		$('body').removeClass('config-view posts-view new-post-view events-view search-view');
		switch($('#view-menu .button').index(this)) {
			case 0:
				$('body').addClass('config-view');
				break;
			case 1:
				$('body').addClass('posts-view');
				break;
			case 2:
				$('body').addClass('new-post-view');
				$('input#media-loader').click(); // Petición de archivo
				break;
			case 3:
				$('body').addClass('events-view');
				break;
			case 4:
				$('body').addClass('search-view');
				break;
		}
	});

	$('#share-new-post .share').on('tapone', function() {
		$(this).toggleClass('selected');
	});

	$('.show-more').on('tapone', function() {
		// TODO: Evaluar
		$('.events-list').addClass('show-more');
	});

	// Restringe el uso de espacios, @ y cualquier otro caracter que no esté en la expresión regular al escribir el nombre del evento
	$("#new-event-name").bind('keypress', function(event) {
		var regex = new RegExp("[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+");
		var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
		console.log(regex.test(key));
		if (!regex.test(key)) {
			event.preventDefault();
		}
	});

	$('input.event-name').on('focus', function() {
		$('body').addClass('view-menu-hidden');
	});
	$('input.event-name').on('focusout', function() {
		$('body').removeClass('view-menu-hidden');
	});

	// Vista de seguidores y seguidos
	$('#relation-tabs .relation-tab').on('tapone', function() {
		$('#user-relation').removeClass('viewing-followers viewing-following');
		$(this).parents('#user-relation').addClass('viewing-' + $(this).attr('viewing'));
	});
});

/*
 * Framework Angular
 * -----------------
 */

// ES Locale
if($('html').attr('lang') == 'es') {
	angular.module("ngLocale", [], ["$provide", function($provide) {
	var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
	$provide.value("$locale", {"DATETIME_FORMATS":{"MONTH":["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],"SHORTMONTH":["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],"DAY":["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],"SHORTDAY":["dom","lun","mar","mié","jue","vie","sáb"],"AMPMS":["a.m.","p.m."],"medium":"dd/MM/yyyy HH:mm:ss","short":"dd/MM/yy HH:mm","fullDate":"EEEE d 'de' MMMM 'de' y","longDate":"d 'de' MMMM 'de' y","mediumDate":"dd/MM/yyyy","shortDate":"dd/MM/yy","mediumTime":"HH:mm:ss","shortTime":"HH:mm"},"NUMBER_FORMATS":{"DECIMAL_SEP":",","GROUP_SEP":".","PATTERNS":[{"minInt":1,"minFrac":0,"macFrac":0,"posPre":"","posSuf":"","negPre":"-","negSuf":"","gSize":3,"lgSize":3,"maxFrac":3},{"minInt":1,"minFrac":2,"macFrac":0,"posPre":"\u00A4 ","posSuf":"","negPre":"\u00A4 -","negSuf":"","gSize":3,"lgSize":3,"maxFrac":2}],"CURRENCY_SYM":"€"},"pluralCat":function (n) {  if (n == 1) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;},"id":"es"});
	}]);
}

// Controlador

var loadedImgs = 0;
var getPostsBool = true;
var mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )?true:false;
function Application($scope, $http) {
	/*
	 * User
	 */

	$scope.user = {};

	$scope.user.data = {};
	//$scope.user.peopleToFollow = [];

	if(url != '') {
		if(reqType == 'event'){
			var res = url.split('@');
			var eventNameSimple = res[1].toLowerCase();

			$.getJSON('http://juaku-dev.cloudapp.net:5000/list/event', function(data){
				$.each(data, function(key, value){
					for(var i=0; i<value.length; i++) {
						console.log(eventNameSimple + ' ' + value[i].name);
						if(eventNameSimple == value[i].name) {
							getTrends();
							getEvents();
							$scope.user.getFollowers();
							$scope.user.getFollowing();
							angular.element(document.getElementById('controller')).scope().getMediaByFilter('post', 'trend', value[i]);
							break;
						}
					}
				});
			});
		} else if(reqType == 'user') {
			//var res = location.hash.split('#');
			var res = url.split('-');
			var firstName = res[0].toLowerCase();
			var colorHexLowerCase = res[1].toLowerCase();
			var commonNames = [];
			var countCommonNames = 0;

			$.getJSON('http://juaku-dev.cloudapp.net:5000/user/getAllUsers', function(data){
				$.each(data, function(key, value){
					for(var i=0; i<value.length; i++) {
						if(firstName == value[i].firstName.toLowerCase()) {
							commonNames[countCommonNames] = value[i];
							countCommonNames++;
							break;
						}
					}
					for(var i=0; i<commonNames.length; i++) {
						if(colorHexLowerCase == commonNames[i].idKey) {
							getTrends();
							getEvents();
							$scope.user.getFollowers();
							$scope.user.getFollowing();
							angular.element(document.getElementById('controller')).scope().getMediaByFilter('post', 'author', commonNames[i]);
							break;
						}
					}
				});
			});
		}
	} else {
		getGeo(function() {
			$http.post('/user/setGeo', $scope.user).success(function(data) {
				getPosts();
				getTrends();
				getEvents();
				$scope.user.getFollowers();
				$scope.user.getFollowing();
			}).error();
		}, function(errorMsg) {
			console.log(errorMsg);
		});
	}

	var idAux;
	var filterAux;
	var actionAux;
	var gettingPosts = false;
	var firstPostsLoad = true;
	var postQueryCount = 0;
	var postLoadStep = 10;
	var postShown = 0;
	var tmpLoadingPostsNumber;
	var tmpPosts = [];
	var getPostTries = 0;
	var getPostTriesLimit = 20;
	$scope.posts = [];
	$scope.trends = [];
	$scope.events = [];

	createEmptyPosts(5);
	//askForPost();

	$('main').scroll(function() {
		if(!($('#view').height() - $('main').scrollTop() > $(document).height())) {
			askForPost(filterAux, actionAux, idAux);
		}
	});
	
	function askForPost(filter, action, id) { // TODO: EVALUAR: Parece que carga con getPost(). O: En main con pos abs no carga a menos que haya scroll sólo en android
		getPosts(filter, action, id);
	}

	// Cargar los post originales
	function getPosts(filter, action, id) {
		filterAux = filter;
		actionAux = action;
		idAux = id;
		if(!gettingPosts) {
			gettingPosts = true;
			var tmpPostsNumber = tmpPosts.length;
			//
			if($scope.posts.length == 0 || postShown > tmpPostsNumber - postLoadStep) {
				postsQuery(filter, action, id, function(data) {
					if(data!=undefined) {
						for (var i = 0; i < data.length; i++) {
							tmpPosts[i + tmpPostsNumber] = data[i];
						};
						showPosts();
					} else {
						gettingPosts = false;
					}
				}, function() {
				});
			} else {
				$scope.$apply(function() {
					showPosts();
				});
			}
		}
	}

	function postsQuery(filter, action, id, next, error) {
		if(id == undefined && filter == undefined && action == undefined) {
			$http.get('/list/post/' + (postQueryCount==0?'':postQueryCount) ).success(function(data, status) {
				if(status == 204) {
					clearInterval(getPostsInterval);
				} else {
					if(data.posts != undefined) {
						postQueryCount++;
						next(data.posts);
					} else {
						next();
					}
				}
			}).error(function(e) {
				console.log('error!!');
				//error(e);
			});
		} else {
			$http.get('/list/' + filter + '/' + action + '/' + id + '/' + (postQueryCount==0?'':postQueryCount) ).success(function(data, status) {
				if(status == 204) {
					clearInterval(getPostsInterval);
				} else {
					if(data.posts != undefined) {
						postQueryCount++;
						next(data.posts);
					} else {
						next();
					}
				}
			}).error(function(e) {
				console.log('error!!');
				//error(e);
			});
		}
	}

	function showPosts() {
		var numberPostsNow = $scope.posts.length - tmpLoadingPostsNumber;
		postShown += postLoadStep;
		//TODO EVALUAR: No se mostrá los n>5 últimos posts.
		console.log('#1 numberPostsNow = ' + numberPostsNow + ' postShown = ' + postShown);
		for(var i = numberPostsNow; i < postShown; i++) {
			if(tmpPosts[i] != undefined) {
				$scope.posts[i] = $scope.posts[i] == undefined? {} : $scope.posts[i];
				for(var prop in tmpPosts[i]) {
					$scope.posts[i][prop] = tmpPosts[i][prop];
				}
				//$scope.posts[i] = tmpPosts[i];
				//$scope.posts[i].media = 'uploads/' + $scope.posts[i].media;
				$scope.posts[i].timeElapsed = getTimeElapsed($scope.posts[i].time);
				$scope.posts[i].class = 'real';
				console.log($scope.posts[i].author);
			}
		}
		createEmptyPosts(1);
		gettingPosts = false;
	}

	// Crear n post vacios mientras carga los post originales
	function createEmptyPosts(numTmpPost) {
		tmpLoadingPostsNumber = numTmpPost;
		loadedImgs -= numTmpPost;
		var alphaGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
		var lastPostPosition = $scope.posts.length;
		for (var i = 0; i < numTmpPost; i++) {
			$scope.posts[i+lastPostPosition] = {"media":alphaGif,"event":"","time":"","author":{"firstName":"","lastName":"","picture":alphaGif},"class":"blank"};
		};
	}

	// Obtiene los amigos de facebook que están usando la aplicación para luego poder elegir a quien seguir
	$http.get('/user/getAllUsers').success(function(data) {
		//$scope.user.fbFriends = data;
		$scope.usuarios = data;
	});

	// Obtiene a las personas que te siguen o que sigues
	$scope.user.getFollowers = function(type) {
		$http.get('/list/user/followers/0', $scope.user).success(function(data) {
			$scope.user.followers = data;
		}).error();
	}
	$scope.user.getFollowing = function(type) {
		$http.get('/list/user/following/0', $scope.user).success(function(data) {
			$scope.user.following = data;
		}).error();
	}

	$scope.askForSuggestedEvents = function(query) {
		getSuggestedEvents(query);
	}

	function getSuggestedEvents(query) {
		var status;
		$http.get('/list/event/suggested/a').success(function(data, status) {
			$scope.suggestedEvents = [];
			for(i in data) {
				$scope.suggestedEvents[i] = {};
				$scope.suggestedEvents[i].name = data[i].name;
			}
			console.log($scope.suggestedEvents);
		}).error(function(e) {
			console.log('Error al obtener suggestedEvents');
		});
	};

	// Envía un objeto con los datos de la persona que deseas seguir o dejar de seguir mediante un post 
	$scope.followRelation = function(userToFollow) {
		$scope.user.userToFollow = userToFollow;
		if (!$scope.user.userToFollow.following) {
			$scope.user.userToFollow.following = true;
			$http.post('/user/follow', $scope.user).success(function(data) {
			}).error();
		} else {
			$scope.user.userToFollow.following = false;
			$http.post('/user/unfollow', $scope.user).success(function(data) {
			}).error();
		}
	}

	// Se almacena en un arreglo a las personas que deseas seguir para luego hacer la relación mediante seFollowRelation
	var peopleToFollow = [];
	$scope.addListToFollow = function(userToFollow) {
		peopleToFollow[peopleToFollow.length] = userToFollow;
		console.log(userToFollow);
	}

	//Asigna like a la foto que se indicó
	$scope.likeClick = function(post) {
		$scope.post = post;
		if (!$scope.post.like) {
			$scope.post.like = true;
			$http.post('/post/like', $scope.post).success(function(data) {
			}).error();
		} else {
			$scope.post.like = false;
			$http.post('/post/unlike', $scope.post).success(function(data) {
			}).error();
		}
	}

	$scope.report = function (post) {
		$scope.post = post;
		console.log('Application.js ' + $scope.post);
		$http.post('/post/report', $scope.post).success(function(data) {
		}).error();
	}
	$scope.getReportCount = function (post) {
		$scope.post = post;
		console.log('Application.js ' + $scope.post);
		$http.post('/post/getReportCount', $scope.post).success(function(data) {
		}).error();
	}

	// Envía un objeto con los datos de la persona que deseas bloquear o desbloquear mediante un post 
	$scope.blockUser = function(userToBlock) {
		$scope.user.userToBlock = userToBlock;
		if (!$scope.user.userToBlock.block) {
			$scope.user.userToBlock.block = true;
			$http.post('/user/block', $scope.user).success(function(data) {
			}).error();
		} else {
			$scope.user.userToBlock.block = false;
			$http.post('/user/unBlock', $scope.user).success(function(data) {
			}).error();
		}
	}

	// Envía un objeto con los datos de la persona que deseas bloquear o desbloquear mediante un post
	$scope.askLocation = function(postId) {
		$scope.user.postToAskLocation = postId;
		console.log("$scope.user.postToAskLocation: "+$scope.user.postToAskLocation)
		$http.post('/user/askLocation', $scope.user).success(function() {
		}).error();

	}

	/*
	 * Post
	 */
	$scope.newPost = {};
	$scope.newPost.shareOnFb = false;

	$scope.shareOnFb = function() {
		$scope.newPost.shareOnFb = !$scope.newPost.shareOnFb;
		console.log('scope.newPost.shareOnFb: ' + $scope.newPost.shareOnFb);
	}

	$scope.share = function(postFile) {
		$scope.post = postFile;
		$http.post('/post/share', $scope.post).success(function(data) {
		}).error();
	}

	$scope.changeLanguage = function(language) {
		$scope.user.language = language;
		$http.post('/user/change-language', $scope.user).success(function(data) {
		}).error();
	}

	$scope.sendNewPost = function() {/* TODO: Evaluar riesgo de ataque, Crear post para form Multi - Riesgo de ataque
		var createForm = new FormData();

		for (key in $scope.newPost) {
			createForm.append(key, $scope.newPost[key]);
		}
		$http.post('/post', createForm, {
			withCredentials: true,
			headers: {'Content-Type': undefined },
			transformRequest: angular.identity
		}).success(function(data) {
		}).error();
	*/
		$http.post('/post/new', $scope.newPost).success(function(data) {
		}).error();
	}

	function getTimeElapsed(time) {
		var timeElapsedMill = new Date().getTime() - Date.parse(time);
		var timeElapsed = {};
		if(timeElapsedMill < 1000*60) {
			timeElapsed.type = 's';
			timeElapsed.val = 1;
		} else if(timeElapsedMill < 1000*60*60) {
			timeElapsed.type = 'm';
			timeElapsed.val = parseInt(timeElapsedMill/(1000*60));
		} else if(timeElapsedMill < 1000*60*60*24) {
			timeElapsed.type = 'h';
			timeElapsed.val = parseInt(timeElapsedMill/(1000*60*60));
		} else {
			timeElapsed.type = 'd';
			timeElapsed.val = time;
		}
		return timeElapsed;
	}

	$scope.picChange = function(evt) {
		var canvas = document.getElementById('new-media-preview');
		var ctx = canvas.getContext('2d');

		EXIF.getData(evt.target.files[0], function() {
			//console.log(EXIF.pretty(this));
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
					var imgQuality = mobile?0.5:0.75;
					var newImg = canvas.toDataURL( 'image/jpeg' , imgQuality );

					getGeo( function() {
						$('#positionMap img').attr('src','http://maps.googleapis.com/maps/api/staticmap?zoom=15&size=500x100&markers=color:red|' + $scope.newPost.coords.latitude + ',' + $scope.newPost.coords.longitude);
					}, function(errorMsg) {
						console.log(errorMsg);
					});

					$scope.newPost.media = newImg;
				}
				img.src = event.target.result;
			}
			reader.readAsDataURL(evt.target.files[0]);
		});
	}

	$scope.showMoreEvents = function(oldLimit) {
		$scope.limit = oldLimit;
		if($scope.limit <= $scope.trends.length)
			$scope.limit = $scope.limit+3;
		else
			console.log("No hay más eventos en tu ciudad");
	}

	$scope.getMediaByFilter = function(filter, action, object) {
		loadedImgs = 0;
		gettingPosts = false;
		firstPostsLoad = true;
		postQueryCount = 0;
		postLoadStep = 10;
		postShown = 0;
		tmpLoadingPostsNumber;
		tmpPosts = [];
		getPostTries = 0;
		getPostTriesLimit = 20;
		$scope.posts = [];
		//$scope.trends = [];
		createEmptyPosts(5);

		if(object == undefined) {
			history.pushState( {}, null, '/personasQueSigues');
			getPosts(filter, action);
		} else if(object.author != undefined && action == 'author') {//cuando se hace click en un nombre
			history.pushState( {}, null, '/' + object.author.firstName + '-' + object.author.idKey);
			getPosts(filter, action, object.author.idKey);
		} else if(object.author == undefined && action == 'author') {//cuando se pide por url ex:http://juaku-dev.cloudapp.net:5000/Rodrigo#ff0055
			history.pushState( {}, null, '/' + object.firstName + '-' + object.idKey);
			getPosts(filter, action, object.idKey);
		} else if (object.event != undefined && action == 'event') {
			history.pushState( {}, null, '/@' + object.event);
			getPosts(filter, action, object.id);
		} else if (action == 'trend') {
			history.pushState( {}, null, '/@' + object.name);
			getPosts(filter, action, object.id);
		}
	}

	/*
	 * Geo
	 */
	function getGeo(next, error) {
		if (navigator.geolocation) {
			var position = 0;
			navigator.geolocation.getCurrentPosition(function(position) {
				var coords = {};
				coords.accuracy = position.coords.accuracy;
				coords.altitude = position.coords.altitude;
				coords.altitudeAccuracy = position.coords.altitudeAccuracy;
				coords.heading = position.coords.heading;
				coords.latitude = position.coords.latitude;
				coords.longitude = position.coords.longitude;
				coords.speed = position.coords.speed;
				$scope.user.data.coords = coords;
				$scope.newPost.coords = coords;
				console.log('coords: ' + coords.latitude);
				next(); 
			}, function(errorObj) {
				var errorMsg = "";
				switch(errorObj.code) {
					case errorObj.PERMISSION_DENIED:
						errorMsg = "User denied the request for Geolocation."
						break;
					case errorObj.POSITION_UNAVAILABLE:
						errorMsg = "Location information is unavailable."
						break;
					case errorObj.TIMEOUT:
						errorMsg = "The request to get user location timed out."
						break;
					case errorObj.UNKNOWN_ERROR:
						errorMsg = "An unknown error occurred."
						break;
				}
				// TODO: Manejar error 
				alert('Mal! ' + errorMsg);
				error(errorMsg);
			});
		} else {
			error("Geolocation is not supported by this browser.");
		}
	}

	function getTrends () {
		// TODO: Evaluar remoción
		/*
		 * Events
		 */

		// Cargar eventos
		$http.get('/list/trend').success(function(data) {
			$scope.trends = data.trends;
			$scope.limit = 5;
		});
	}

	function getEvents () {
		$http.get('/list/event').success(function(data) {
			$scope.events = data.events;
		});
	}

} // Fin Controlador - function Application($scope, $http)
// Directivas
angular.module('Juaku', [])
.directive('lastPostLoaded', function($timeout) { // Detectar la última carga de Posts
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			if(scope.$last) {
				$timeout(function() {
					postsLoaded();
				});
			}
		}
	};
})
.directive('imageOnLoad', function() { // Aparecer las imagenes cuando carguen
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.bind('load', function() {
				loadedImgs++;
				if(!$(element).hasClass('blank')) {
					$(element).parent().find('.preloader').remove();
					//$(element).addClass('show');
					$(element).parents('.post').addClass('show');
				}
			});
		}
	};
})
.filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
})
//.module('app', ['ngTouch']);

function postsLoaded() {
	$('.like-svg').off('tapone');
	$('.like-svg').on('tapone', function() {
		$(this).parents().toggleClass('selected');
	});

	$('.post .bottom').off('tapone');
	$('.post .bottom').on('tapone', function(event) {
		console.log(event.target);
		$('body').toggleClass('dark');
	});

	// Avanza a la siguiente foto haciendo click

	// Parpadeo cuando se hace scroll hacia abajo
	$('#post-list .media img.media').off('tapone');
	$('#post-list .media img.media').on('tapone', function() { 
		assistedScroll(1, $(this).parents('.post'));
	});
}

function assistedScroll(modifier, refPost) {
	modifier = modifier == undefined ? 1 : modifier;
	var refPostTop = parseInt($(refPost).next().position().top) + 2; // TODO: Arreglar correctamente
	$('main').stop().animate({
			'scrollTop': refPostTop
		}, 200, 'swing', function () {
			//window.location.hash = refPost; TODO: Actualizar hash
	});
}

function reduceString(str) {
	var newString = str;
	var lastIndex = str.lastIndexOf(' ');
	if(str.substring(0, lastIndex) != '') {
		newString = str.substring(0, lastIndex);
	}
	return newString;
}

/*if(window.innerHeight > window.innerWidth){
    document.getElementsByTagName("body").style.transform = "rotate(90deg)";
}*/