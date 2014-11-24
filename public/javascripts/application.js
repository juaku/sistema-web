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
		$('#main-controls').width($('section#view #view-wrapper').width());
		resizePostTitle();
	});
});

function resizePostTitle() {
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
function Application($scope, $http) {
	$scope.newPost = {};

	$scope.posts = [];
	// Crear 5 post vacios mientras carga los post originales
	var numTmpPost = 5;
	var alphaGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
	for (var i = 0; i < numTmpPost; i++) {
		$scope.posts[i] = {"media":alphaGif,"event":"","time":"","author":{"firstName":"","lastName":"","picture":alphaGif}};
	};
	// Cargar los post originales
	$http.get('/post').success(function(data) {
		$scope.posts = data;
		for (var i = 0; i < $scope.posts.length; i++) {
			$scope.posts[i].media = 'uploads/' + $scope.posts[i].media;
			$scope.posts[i].timeElapsed = getTimeElapsed($scope.posts[i].time);
		};
	});

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
		console.log($scope.newPost);
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

}

// Directivas
angular.module('Juaku', [])
.directive('evalTamEventPost', function() {
return function(scope, element, attrs) {
	if (scope.$last) {
		postsLoaded();
	}
};
});

function postsLoaded() {
	$('.like-svg').on('click', function() {
		$(this).parent().toggleClass('selected');
	});
	resizePostTitle();
}

function reduceString(str) {
	var newString = str;
	var lastIndex = str.lastIndexOf(' ');
	if(str.substring(0, lastIndex) != '') {
		newString = str.substring(0, lastIndex);
	}
	return newString;
}

function picChange(evt) { /* No funciona para escritorio
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
		drawPreview(orientation)
	});

	function drawPreview(orientation) {
		var reader = new FileReader();
		reader.onload = function(event) {
			var img = new Image();
			img.onload = function() {
				var nTam = 1000;
				canvas.width = nTam;
				canvas.height = nTam;
				var nWidth = nTam;
				var nHeight = nTam;
				if(img.width > img.height) {
					nWidth = img.width * nTam / img.height;
				} else if(img.width < img.height) {
					nHeight = img.height * nTam / img.width;
				}
				var variation = {a: 0, desX: 0, desY: 0, cntX: -1, cntY: 0, swt:false};

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
				var newImg = canvas.toDataURL( 'image/jpeg' , 0.7 );
				//document.write('<img src=' + newImg + '></img>');
				angular.element($('input#media-loader')).scope().newPost.media = newImg;
			}
			img.src = event.target.result;
		}
		reader.readAsDataURL(evt.target.files[0]);
	}
}