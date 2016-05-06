var express = require('express');
var router = express.Router();

/* GET router para '/'
 * Renderiza la vista 'index.jade' o la 'login.jade' dependiendo si el usuario
 * está logueado o no
 */
router.get('/', function(req, res) {
	if (req.isAuthenticated()) {
		res.render('index', { user: req.user, locale: req.getLocale()});
	} else {
		res.render('login');
	}
});

router.get('/:tag(@[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+)', function(req, res) {
	if (req.isAuthenticated()) {
		res.render('index', { user: req.user, locale: req.getLocale(), url: req.params.tag, reqType: 'tag'});
	} else {
		res.render('login');
	}
});

router.get('/:author([0-9a-fA-F]{3}(\.+[a-zA-Z]+))', function(req, res) {
	if (req.isAuthenticated()) {
		res.render('index', { user: req.user, locale: req.getLocale(), url: req.params.author, reqType: 'author'});
	} else {
		res.render('login');
	}
});

/*router.get('/:channel([0-9a-fA-F]{3}(\.+[a-zA-Z]+)(@[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+))', function(req, res) {
	if (req.isAuthenticated()) {
		console.log('req.params');
		console.log(req.params);
		res.render('index', { user: req.user, locale: req.getLocale(), url: req.params.channel, reqType: 'channel'});
	} else {
		res.render('login');
	}
});*/

module.exports = router;
