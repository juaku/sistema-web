/*
 * Arreglos jQuery
 * ---------------
 */

/*
 * Corregir el scroll horizontal para 'main aside' y 'header'
 */
$(window).on('scroll', function() {
	$('header, main aside').css({
		'margin-left': $(this).scrollLeft() * -1
	});
});

/*
 * Hacer que 'aside#controls' llene el espacio entre header y el final de la ventana
 */
$(window).on('load resize', function() {
	$('aside#controls').css('height', $(this).height() - $('header').height());
});

/*
 * Eventos de document.ready
 */
$(document).on('ready', function() {
	/*
	 * Menú desplegable de la cabecera
	 */
	$('header nav #select #options').hide();

	$('header nav #select').on('click', function() {
		$(this).find('#options').show();
	});

	$('html').on('click', function() {
		$('header nav #select #options').hide();
	});

	$('header nav #select #current').on('click', function(event) {
		if($('header nav #select #options').css('display') != 'none') {
			$('header nav #select #options').hide();
			event.stopPropagation();
		}
	});

	$('header nav #select').on('click', function(event) {
		event.stopPropagation();
	});

	$('header nav #select #options li').on('click', function(event) {
		$('header nav #select #options').hide();
		$('header nav #select #current').html($(this).html());
		event.stopPropagation();
	});

	/*
	 * Menú administrador de vistas
	 */
	$('header nav#main-menu li a').on('click', function(event) {
		event.preventDefault();
		$('section#views .view').addClass('hidden');
		$('section#views').find($(this).attr('href')).removeClass('hidden')
	});

	/*
	 * Crear evento opciones
	 */
	$('section#new-event .method').on('click', function(event) {
		$('section#new-event .method').addClass('hidden');
		$(this).removeClass('hidden');
	});
});


/*
 * Framework angular.js
 * --------------------
 */
function Application($scope, $http) {
	$scope.attendance = false;

	$scope.showEvents = function() {
		$http.get('/events').success(function(data) {
			$scope.events = data;
		});
	}

	$scope.showEvents();

	$http.get('/events?source=fb').success(function(data) {
		$scope.eventsFb = data;
	});

	$scope.save = function(source) {		
		var createForm = new FormData();
		
		$scope.newEvent.source = source;

		for (key in $scope.newEvent) {
			createForm.append(key, $scope.newEvent[key]);
		}

    $http.post('/events', createForm, {
        withCredentials: true,
        headers: {'Content-Type': undefined },
        transformRequest: angular.identity
    }).success(function(data) {
				$scope.showEvents();
		}).error();
	}

	$scope.join = function(eventId, joined) {
		if(!joined) {
			$http.put('/events/join', {eventId : eventId}).success(function(data) {
				$scope.showEvents();
			});
		} else {	
			$http.put('/events/leave', {eventId : eventId}).success(function(data) {
				$scope.showEvents();
			});
		}
	}

	$scope.dateDetail = function(k, d) {
		if($scope.events[k].date!=undefined && $scope.events[k].date!= " ") {
			var str = $scope.events[k].date;
			var res = str.split(" ");
			var aux = res[0].split(",");
			if(d=='ewd') {
				var dayWeek = aux[0];
				return dayWeek;
			} else if (d == 'ewm') {
				var dayMonth = res[1];
				return dayMonth;
			} else if (d == 'em'){
				var month = res[2];
				return month;
			} else {
				var time = res[4];
				return time;
			}
		}
	};

	/*
	 * Framework socket.io
	 */
	/*var socket = io();
	socket.on('newEvent', function() {
		$scope.showEvents();
	});
	*/
}


