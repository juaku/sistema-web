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
		$('form input').click();
	})
});

/*
 * Framework Angular
 * -----------------
 */

function Application($scope, $http) {
	$scope.newPost = {};

	$scope.send = function() {
		var createForm = new FormData();

		for (key in $scope.newPost) {
			createForm.append(key, $scope.newPost[key]);
		}
/*
		$http.post('/events', createForm, {
			withCredentials: true,
			headers: {'Content-Type': undefined },
			transformRequest: angular.identity
		}).success(function(data) {
		}).error();*/
	}
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
	var canvas = document.getElementById('capturedPhoto');
	var ctx = canvas.getContext('2d');

	EXIF.getData(evt.target.files[0], function() {
		console.log(EXIF.pretty(this));
		var orientation = this.exifdata.Orientation;
		drawPreview(orientation)
	});

	function drawPreview(orientation) {
		var reader = new FileReader();
		reader.onload = function(event) {
			var img = new Image();
			img.onload = function() {
				var nTam = 500;
				var nWidth = nTam;
				var nHeight = nTam;
				if(img.width > img.height) {
					nWidth = img.width * nTam / img.height; 
				} else if(img.width < img.height) {
					nHeight = img.height * nTam / img.width; 
				}

				var variation = {a: 0, width: nWidth, height: nHeight, desX: 0, desY: 0};

				switch(orientation) {
					case 3:
						variation = {a: 180, width: nWidth, height: nHeight, desX: -1, desY: -1};
						break;
					case 6:
						variation = {a: 90, width: nHeight, height: nWidth, desX: 0, desY: -1};
						break;
					case 8:
						variation = {a: -90, width: nHeight, height: nWidth, desX: -1, desY: 0};
						break;
				}
				canvas.width = variation.width;
				canvas.height = variation.height;
				ctx.rotate(variation.a*Math.PI/180);
				ctx.drawImage(img,nWidth*variation.desX,nHeight*variation.desY,nWidth,nHeight);
			}
			img.src = event.target.result;
		}
		reader.readAsDataURL(evt.target.files[0]);
	}
}