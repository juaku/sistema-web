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
 * Menú desplegable de la cabecera
 */
$(document).on('ready', function() {
	$('header nav #select #options').hide();

	$('header nav #select').on('click', function() {
		$(this).find('#options').show();
	});

	$('html').on('click', function() {
		$('header nav #select #options').hide();
	});

	$('header nav #select').on('click', function(event) {
		event.stopPropagation();
	});

	$('header nav #select #options li').on('click', function(event) {
		$('header nav #select #options').hide();
		$('header nav #select #current').html($(this).html());
		event.stopPropagation();
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
}
