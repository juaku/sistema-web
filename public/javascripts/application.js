// 	/*
// 	 * Framework socket.io
// 	 */
// 	/*var socket = io();
// 	socket.on('newEvent', function() {
// 		$scope.showEvents();
// 	});
// 	*/
// }

$(function() {
    FastClick.attach(document.body);
});

//
//	Código de maquetación
//

// Evitar que se ejecute clicks fuera del area coloreada del logotipo
//
$('#logo-link').on('click', function(event){
	event.preventDefault();
});

$('#logo-link #logo #logo-icon').on('click', function(event){
	window.document.location = '/';
});

// Cambiar de tema
//
$('#title img').on('click', function(event) {
	$('body').toggleClass('dark');
});

$('#take').on('click', function() {
	$('body').addClass('new-post-view');
	$('input#media-loader').click();
});

$('#share-new-post .share').on('click', function() {
	$(this).toggleClass('selected');
});

$('input.event-name').on('focus', function() {
	$('body').addClass('view-menu-hidden');
});
$('input.event-name').on('focusout', function() {
	$('body').removeClass('view-menu-hidden');
});

// Vista de seguidores y seguidos
//
$('#relation-tabs .relation-tab').on('click', function() {
	$('#user-relation').removeClass('viewing-followers viewing-following');
	$(this).parents('#user-relation').addClass('viewing-' + $(this).attr('viewing'));
});

$('main').previousTop = 0;

$('#account a.user-link').on('click', function() {
	$('aside').toggleClass('show');
});

$('#back').on('click', function() {
	history.back();

});

window.onpopstate = function(event) {
	angular.element(document.getElementById('controller')).scope().actions = event.state;
};

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

	// Avanza a la siguiente foto haciendo click
	//
	function assistedScroll(modifier, refPost) {
		modifier = modifier == undefined ? 1 : modifier;
		var refPostTop = parseInt($(refPost).next().offset().top) + $('main').scrollTop() + 2; // TODO: Arreglar correctamente
		console.log(refPostTop);
		$('main').stop().animate({
				'scrollTop': refPostTop
			}, 200, 'swing', function () {
				//window.location.hash = refPost; TODO: Actualizar hash
		});
	}

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

//
// Framework Angular
//

// ES Locale
//
if($('html').attr('lang') == 'es') {
	angular.module("ngLocale", [], ["$provide", function($provide) {
	var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
	$provide.value("$locale", {"DATETIME_FORMATS":{"MONTH":["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],"SHORTMONTH":["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],"DAY":["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],"SHORTDAY":["dom","lun","mar","mié","jue","vie","sáb"],"AMPMS":["a.m.","p.m."],"medium":"dd/MM/yyyy HH:mm:ss","short":"dd/MM/yy HH:mm","fullDate":"EEEE d 'de' MMMM 'de' y","longDate":"d 'de' MMMM 'de' y","mediumDate":"dd/MM/yyyy","shortDate":"dd/MM/yy","mediumTime":"HH:mm:ss","shortTime":"HH:mm"},"NUMBER_FORMATS":{"DECIMAL_SEP":",","GROUP_SEP":".","PATTERNS":[{"minInt":1,"minFrac":0,"macFrac":0,"posPre":"","posSuf":"","negPre":"-","negSuf":"","gSize":3,"lgSize":3,"maxFrac":3},{"minInt":1,"minFrac":2,"macFrac":0,"posPre":"\u00A4 ","posSuf":"","negPre":"\u00A4 -","negSuf":"","gSize":3,"lgSize":3,"maxFrac":2}],"CURRENCY_SYM":"€"},"pluralCat":function (n) {  if (n == 1) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;},"id":"es"});
	}]);
}

// Controlador
//
var loadedImgs = 0;
var getPostsBool = true;
var mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )?true:false;

// 
// 
function Application($scope, $http, $window) {

	// Modelo User
	//
	$scope.user = {};
	$scope.user.data = {};

	var filterAux,
		pathnameAux,
		gettingPosts = false,
		firstPostsLoad = true,
		postQueryCount = 0,
		postLoadStep = 10,
		postShown = 0,
		tmpLoadingPostsNumber,
		tmpPosts = [],
		getPostTries = 0,
		getPostTriesLimit = 20;

	$scope.refresh = function(pathname) {
		initialize();
		loadedImgs = 0;
		getPosts(pathname, function(data) {
			var state = {};
			state.data = data;
			state.path = pathnameAux;
			history.pushState( state, null, '/' +  pathnameAux);
			$('#title').val(pathnameAux);
			console.log('pathnameAux');
			console.log(pathnameAux);
			if(pathnameAux == '') {
				$('.user-link').show();
			} else {
				$('.user-link').hide();
			}
		});
		//createEmptyPosts(5);
	}

	var pathRegExp = new RegExp(/^\/((?:[0-9A-Fa-f]{3})\.(?:[A-Za-z%]{3,}))?(?:@([0-9A-Za-z%]{3,}))?$|^\/([0-9A-Za-z%]{3,})$/g);
	var path = pathRegExp.exec(window.location.pathname);

	if(path[0]) {
		angular.element(document.getElementById('controller')).scope().refresh(path[0].substring(1));
	}

	function initialize() {
		gettingPosts = false;
		firstPostsLoad = true;
		postQueryCount = 0;
		postLoadStep = 10;
		postShown = 0;
		tmpLoadingPostsNumber;
		tmpPosts = [];
		getPostTries = 0;
		getPostTriesLimit = 20;
		$scope.actions = [];
		$scope.trends = [];
		$scope.events = [];
	}

	createEmptyPosts(5);
	//askForPost();

	$(document).scroll(function() {
		if(window.innerWidth + $('body').scrollTop()*1.2 >= $(document).height()) {
			askForPost(pathnameAux);
		}
	});
	
	function askForPost(pathname) {
		getPosts(pathname);
	}

	function getPosts(pathname, next) {
		pathnameAux = pathname;
		if(!gettingPosts) {
			gettingPosts = true;
			var tmpPostsNumber = tmpPosts.length;
			if($scope.actions.length == 0 || postShown > tmpPostsNumber - postLoadStep) {
				postsQuery(pathname, function(data) {
					if(data!=undefined) {
						for (var i = 0; i < data.length; i++) {
							tmpPosts[i + tmpPostsNumber] = data[i];
						};
						showPosts(function (data) {
							next(data);
						});
					} else {
						gettingPosts = false;
					}
				}, function() {
				});
			} else {
				$scope.$apply(function() {
					showPosts(function (data) {
						next(data);
					});
				});
			}
		}
	}

	function postsQuery(pathname, next, error) {
		$http.get('/list' + (pathname==''?pathname:'/'+pathname) + (postQueryCount>0?'/'+postQueryCount:'') ).success(function(data, status) {
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
			error(e);
		});
	}

	function showPosts(next, error) {
		var numberPostsNow = $scope.actions.length - tmpLoadingPostsNumber;
		postShown += postLoadStep;
		//TODO EVALUAR: No se mostrá los n>5 últimos posts.
		for(var i = numberPostsNow; i < postShown; i++) {
			if(tmpPosts[i] != undefined) {
				$scope.actions[i] = $scope.actions[i] == undefined? {} : $scope.actions[i];
				for(var prop in tmpPosts[i]) {
					$scope.actions[i][prop] = tmpPosts[i][prop];
				}
				//$scope.actions[i] = tmpPosts[i];
				//$scope.actions[i].media = 'uploads/' + $scope.actions[i].media;
				$scope.actions[i].author.url = $scope.actions[i].author.hexCode + '.' + $scope.actions[i].author.firstName;
				$scope.actions[i].timeElapsed = getTimeElapsed($scope.actions[i].time);
				$scope.actions[i].class = 'real';
				$scope.actions[i].editing = $scope.actions[i].showTools = false;
			}
		}

		createEmptyPosts(1);
		gettingPosts = false;

		next($scope.actions);
	}

	// Crear 'numTmpPost' espacios vacios mientras carga los post originales
	function createEmptyPosts(numTmpPost) {
		tmpLoadingPostsNumber = numTmpPost;
		loadedImgs -= numTmpPost;
		var alphaGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
		var lastPostPosition = $scope.actions.length;
		for (var i = 0; i < numTmpPost; i++) {
			$scope.actions[i+lastPostPosition] = {"media":alphaGif,"event":"","time":"","author":{"firstName":"","lastName":"","picture":alphaGif},"class":"blank"};
		};
	}

	$scope.modifyTag = function(action) {
		action.editing = true;
		$scope.oldTag = action.tag;
	}

	$scope.updateTag = function(action) {
		action.oldTag = $scope.oldTag;
		action.editing = true;
		$http.post('/post/editTag', action).success(function() {
		}).error();
	}

	$scope.deleteAction = function(post) {
		$scope.post = post;
		$http.post('/post/deleteAction', $scope.post).success(function(data) {
		}).error();
	}

	// Guarda la foto
	$scope.saveClick = function(post) {
		$scope.post = post;
		if (!$scope.post.saved) {
			$scope.post.saved = true;
			$http.post('/post/save', $scope.post).success(function(data) {
			}).error();
		} else {
			$scope.post.saved = false;
			$http.post('/post/unsave', $scope.post).success(function(data) {
			}).error();
		}
	}

	$scope.reportAction = function (post) {
		$scope.post = post;
		$http.post('/post/reportAction', $scope.post).success(function(data) {
		}).error();
	}

	// Envía un objeto con los datos del usuario que se desea bloquear o desbloquear mediante un post
	//
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

	// Post
	// 
	$scope.newAction = {};
	$scope.newAction.shareOnFb = false;

	$scope.shareOnFb = function() {
		$scope.newAction.shareOnFb = !$scope.newAction.shareOnFb;
	}

	$scope.shareActionOnFb = function(post) {
		$scope.post = post.media;
		$http.post('/post/shareActionOnFb', $scope.post).success(function(data) {
		}).error();
	}

	$scope.changeLanguage = function(language) {
		$scope.user.language = language;
		$http.post('/user/change-language', $scope.user).success(function(data) {
		}).error();
	}

	$scope.sendNewAction = function() {/* TODO: Evaluar riesgo de ataque, Crear post para form Multi - Riesgo de ataque
		var createForm = new FormData();

		for (key in $scope.newAction) {
			createForm.append(key, $scope.newAction[key]);
		}
		$http.post('/post', createForm, {
			withCredentials: true,
			headers: {'Content-Type': undefined },
			transformRequest: angular.identity
		}).success(function(data) {
		}).error();
	*/
		$http.post('/post/new', $scope.newAction).success(function(data) {
		}).error();
	}

	$scope.updateContent = function(state) {
		if (state == null)
			return;
		$scope.actions = state.data;
		$('#title').val(state.path);
		$scope.$apply();
		$('media').scrollTop(0);
		if(state.path == '') {
			$('.user-link').show();
		} else {
			$('.user-link').hide();
		}
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
		console.log('PIC');
		var canvas = document.getElementById('new-media-preview');
		var ctx = canvas.getContext('2d');

		EXIF.getData(evt.target.files[0], function() {
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
						//$('#positionMap img').attr('src','http://maps.googleapis.com/maps/api/staticmap?zoom=15&size=500x100&markers=color:red|' + $scope.newAction.coords.latitude + ',' + $scope.newAction.coords.longitude);
					}, function(errorMsg) {
						console.log(errorMsg);
					});

					$scope.newAction.media = newImg;

				}
				img.src = event.target.result;
			}
			reader.readAsDataURL(evt.target.files[0]);
		});
	}

	// Geo
	//
	function getGeo(next, error) {
		if (navigator.geolocation) {
			var position = 0;
			next(); 

			// TODO: HTTPS

			/*			
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
				$scope.newAction.coords = coords;
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
			*/
		} else {
			error("Geolocation is not supported by this browser.");
		}
	}
}

//
// Directivas
//
angular.module('Juaku', [])
.factory('authInterceptor', function ($rootScope, $q, $window) {
	return {
		request: function (config) {
			config.headers = config.headers || {};
			if (token) {
				config.headers.Authorization = 'Bearer ' + token;
			}
			return config;
		},
		response: function (response) {
			if (response.status === 401) {
				// handle the case where the user is not authenticated
			}
			return response || $q.when(response);
		}
	};
})
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
})
.directive('lastPostLoaded', function($timeout) { // Detectar la última carga de Posts
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			if(scope.$last) {
				$timeout(function() {
					actionsLoaded();
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
					$(element).parents('article').addClass('show');
				}
			});
		}
	};
})
.directive('search', function() {
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, controller) {
			function search(text) {
				var transformedSearch = text.replace(/[^A-Z0-9a-z@.'/]/g, '');
				
				//var titleFontSize = 72;
				//$(element).css('font-size', titleFontSize - ((text.length - 16)* 2));
				
				if(transformedSearch !== text) {
					controller.$setViewValue(transformedSearch);
					controller.$render();
				}
				return transformedSearch;  // or return Number(transformedInput)
			}
			controller.$parsers.push(search);
		}
	};
})
.filter('capitalize', function() {
	return function(input) {
		return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
	}
})

/*if(window.innerHeight > window.innerWidth){
    document.getElementsByTagName("body").style.transform = "rotate(90deg)";
}*/

window.addEventListener('popstate', function(event) {
	angular.element(document.getElementById('controller')).scope().updateContent(event.state);
});