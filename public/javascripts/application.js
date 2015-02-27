// /*
//  * Framework angular.js
//  * --------------------
//  */
// function Application($scope, $http) {
// 	$scope.attendance = false;

// 	$scope.showEvents = function() {
// 		$http.get('/events').success(function(data) {
// 			$scope.events = data;
// 		});
// 	}

// 	$scope.showEvents();

// 	$http.get('/events?source=fb').success(function(data) {
// 		$scope.eventsFb = data;
// 	});

// 	$scope.save = function(source) {		
// 		var createForm = new FormData();

// 		$scope.newEvent.source = source;

// 		for (key in $scope.newEvent) {
// 			createForm.append(key, $scope.newEvent[key]);
// 		}

//     $http.post('/events', createForm, {
//         withCredentials: true,
//         headers: {'Content-Type': undefined },
//         transformRequest: angular.identity
//     }).success(function(data) {
// 				$scope.showEvents();
// 		}).error();
// 	}

// 	$scope.join = function(eventId, joined) {
// 		if(!joined) {
// 			$http.put('/events/join', {eventId : eventId}).success(function(data) {
// 				$scope.showEvents();
// 			});
// 		} else {	
// 			$http.put('/events/leave', {eventId : eventId}).success(function(data) {
// 				$scope.showEvents();
// 			});
// 		}
// 	}

// 	$scope.dateDetail = function(k, d) {
// 		if($scope.events[k].date!=undefined && $scope.events[k].date!= " ") {
// 			var str = $scope.events[k].date;
// 			var res = str.split(" ");
// 			var aux = res[0].split(",");
// 			if(d=='ewd') {
// 				var dayWeek = aux[0];
// 				return dayWeek;
// 			} else if (d == 'ewm') {
// 				var dayMonth = res[1];
// 				return dayMonth;
// 			} else if (d == 'em'){
// 				var month = res[2];
// 				return month;
// 			} else {
// 				var time = res[4];
// 				return time;
// 			}
// 		}
// 	};

// 	/*
// 	 * Framework socket.io
// 	 */
// 	/*var socket = io();
// 	socket.on('newEvent', function() {
// 		$scope.showEvents();
// 	});
// 	*/
// }

//window.location.href = 'http://juaku-dev.cloudapp.net:3000/logout';

/*
 * Código de maquetación
 * ---------------------
 */

$(document).ready(function() {
	$('#camera').click(function(event) {
		$('input#media-loader').click();
		$('body').addClass('float-view');
	});
	$(window).on('load resize', function() {
		resizeTask();
	});
	/*setInterval(function() {
		$("#post-list div.media").toggleClass('animate');
	}, 500);*/
});

function resizeTask() {
	$('#main-controls').width($('section#view #view-wrapper').width()); // TODO: Corregir comportamiento
	$('#post-list .post-detail .post-title').width(0);
	$('#post-list .post-detail .post-title').width($('#post-list .post-detail').first().width());
}


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
var mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )?true:false;
function Application($scope, $http) {

	/*
	 * User
	 */

	$scope.user = {};

	$scope.user.data = {};
	$scope.user.peopleToFollow = [];


	getGeo(function() {
		$http.post('/user', $scope.user).success(function(data) {
			getPosts();
		}).error();
	}, function(errorMsg) {
		//getPosts();
		console.log(errorMsg);
	});


	var gettingPosts = false;
	var firstPostsLoad = true;
	var postQueryCount = 0;
	var postLoadStep = 5;
	var postShown = 0;
	var tmpLoadingPostsNumber;
	var tmpPosts = [];
	var getPostTries = 0;
	var getPostTriesLimit = 30;
	$scope.posts = [];

	createEmptyPosts(5);
	
	//getPosts();

	/* TODO: Ver si es que es necesario
	$(window).scroll(function() {
			tryGetPosts();
	});*/

	var getPostsInterval = setInterval(tryGetPosts, 500);
	
	function tryGetPosts() {
		if($(window).scrollTop() + $(window).height() > $(document).height() - $(window).height()*2) {
			//console.log(loadedImgs + ' ' + postShown + ' ' + tmpLoadingPostsNumber);
			if(loadedImgs >= postShown || getPostTries >= getPostTriesLimit) {
				getPostTries = 0;
				getPosts();
			} else {
				getPostTries++;
			}
		}
	}

	// Cargar los post originales
	function getPosts() {
		if(!gettingPosts) {
			gettingPosts = true;
			var tmpPostsNumber = tmpPosts.length;
			//
			if($scope.posts.length == 0 || postShown > tmpPostsNumber - postLoadStep) {
				postsQuery(function(data) {
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

	function postsQuery(next, error) {
		$http.get('/post/' + (postQueryCount==0?'':postQueryCount) ).success(function(data, status) {
			if(status == 204) {
				clearInterval(getPostsInterval);
			} else {
				if(data.posts != undefined) {
					postQueryCount++;
					$scope.events = data.events;
					next(data.posts);
				} else {
					next();
				}
			}
		}).error(function(e) {
			error(e);
		});
	}

	function showPosts() {
		var numberPostsNow = $scope.posts.length - tmpLoadingPostsNumber;
		postShown += postLoadStep;
		//TODO: No se mostrá los n>5 últimos posts.
		for(var i = numberPostsNow; i < postShown; i++) {
			if(tmpPosts[i] != undefined) {
				$scope.posts[i] = tmpPosts[i];
				$scope.posts[i].media = 'uploads/' + $scope.posts[i].media;
				$scope.posts[i].timeElapsed = getTimeElapsed($scope.posts[i].time);
				$scope.posts[i].class = 'real';
			}
		}
		//console.log($scope.posts.length);
		createEmptyPosts(1);
		gettingPosts = false;
	}

	// Crear n post vacios mientras carga los post originales
	function createEmptyPosts(numTmpPost) {
		tmpLoadingPostsNumber = numTmpPost;;
		loadedImgs -= numTmpPost;
		var alphaGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
		var lastPostPosition = $scope.posts.length;
		for (var i = 0; i < numTmpPost; i++) {
			$scope.posts[i+lastPostPosition] = {"media":alphaGif,"event":"","time":"","author":{"firstName":"","lastName":"","picture":alphaGif},"class":"blank"};
		};
		//console.log($scope.posts.length + ',' + tmpPosts.length);
	}

	// Obtiene los amigos de facebook que están usando la aplicación para luego poder elegir a quien seguir
	$http.get('/user').success(function(data) {
		//$scope.user.fbFriends = data;
		$scope.usuarios = data;
	});

	// Envía un objeto con los datos de las personas a seguir mediante un post 
	$scope.setFollowRelation = function() {
		$scope.user.peopleToFollow = peopleToFollow;
		$http.post('/user', $scope.user).success(function(data) {
		}).error();
	}

	// Se almacena en un arreglo a las personas que deseas seguir para luego hacer la relación mediante seFollowRelation
	var peopleToFollow = [];
	$scope.addListToFollow = function(userToFollow) {
		peopleToFollow[peopleToFollow.length] = userToFollow;
		console.log(userToFollow);
	}

	/*
	 * Post
	 */
	$scope.newPost = {};

	$scope.send = function() {/* Crear post para form Multi - Riesgo de ataque
		var createForm = new FormData();

		for (key in $scope.newPost) {
			createForm.append(key, $scope.newPost[key]);
		}

		console.log(createForm);

		$http.post('/post', createForm, {
			withCredentials: true,
			headers: {'Content-Type': undefined },
			transformRequest: angular.identity
		}).success(function(data) {
		}).error();
	*/
		$http.post('/post', $scope.newPost).success(function(data) {
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

	$scope.picChange = function(evt) { /* No funciona para escritorio
		var fileInput = evt.target.files;
		if(fileInput.length>0){
			var windowURL = window.URL || window.webkitURL;
			var picURL = windowURL.createObjectURL(fileInput[0]);
			console.log(picURL);
			var photoCanvas = document.getElementById("capturedPhoto");
			var ctx = photoCanvas.getContext("2d");
			var photo = new Image();
			photo.onload = function(){
				//draw photo into canvas when ready
				ctx.drawImage(photo, 0, 0, 500, 500);
			};
			photo.src = picURL;
			windowURL.revokeObjectURL(picURL);
		}*/


		var canvas = document.getElementById('new-media-preview');
		var ctx = canvas.getContext('2d');

		EXIF.getData(evt.target.files[0], function() {
			//console.log(EXIF.pretty(this));
			var orientation = this.exifdata.Orientation;
			var reader = new FileReader();
			reader.onload = function(event) {
				var img = new Image();
				img.onload = function() {
					var nTam = 640;
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
					//document.write('<img src=' + canvas.toDataURL( 'image/jpeg' , 0.7 ) + '></img>');
					//angular.element($('input#media-loader')).scope().newPost.media = newImg;

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

	/*
	 * Geo
	 */
	function getGeo(next, error) {
		if (navigator.geolocation) {
			var position = 0;
      /*navigator.geolocation.getCurrentPosition( function (position) {
        alert(position.coords.latitude);
        alert(position.coords.longitude);
      });*/
			navigator.geolocation.getCurrentPosition(function(position) {
				var coords = {};
				coords.accuracy = position.coords.accuracy;
				coords.altitude = position.coords.altitude;
				coords.altitudeAccuracy = position.coords.altitudeAccuracy;
				coords.heading = position.coords.heading;
				coords.latitude = position.coords.latitude;
				coords.longitude = position.coords.longitude;
				coords.speed = position.coords.speed;
				//angular.element($('input#media-loader')).scope().newPost.coords = coords;
				$scope.user.data.coords = coords;
				$scope.newPost.coords = coords;
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
				alert('Mal! ' + errorMsg);
				error(errorMsg);
			});
		} else {
			error("Geolocation is not supported by this browser.");
		}
	}

	// TODO: Evaluar remoción
	/*
	 * Events
	 */

	$scope.events = [];

	// Cargar eventos
/*	$http.get('/event').success(function(data) {
		$scope.events = data;
		console.log($scope.events);
		/*for (var i = 0; i < $scope.posts.length; i++) {
			$scope.events[i].media = 'uploads/' + $scope.posts[i].media;
			$scope.events[i].timeElapsed = getTimeElapsed($scope.posts[i].time);
		};*/
	/*});*/

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
				if(mobile) {
					$(element).css('transition-duration', '0s');
				}
				if(!$(element).hasClass('blank')) {
					$(element).parent().addClass('loaded');
				}
				$(element).css('opacity', 1);
			});
		}
	};
});

function postsLoaded() {
	resizeTask();
	$('.like-svg').off();
	$('.like-svg').on('click', function() {
		$(this).parent().toggleClass('selected');
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
