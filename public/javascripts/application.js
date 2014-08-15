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

	$http.get('/events').success(function(data) {
		$scope.events = data;
	});

	$http.get('/events?source=fb').success(function(data) {
		$scope.eventsFb = data;
	});

	$scope.save = function(source) {
		$scope.newEvent.source = source;
		$http.post('/events', $scope.newEvent).success(function(data) {
	  });
	}
}
