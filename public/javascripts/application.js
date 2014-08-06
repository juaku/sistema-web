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
})