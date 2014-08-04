/*
 * Función para corregir el scroll horizontal para 'main aside' y 'header'
 */
$(window).scroll(function() {
	$('header, main aside').css({
		'margin-left': $(this).scrollLeft() * -1
	});
});
