var express = require('express');
var router = express.Router();

/* GET router para '/'
 * Renderiza la vista 'index.jade' o la 'login.jade' dependiendo si el usuario
 * está logueado o no
 */
router.get('/', function(req, res) {
	if (req.isAuthenticated()) {
		res.render('index', { user: req.session.jUser, locale: req.getLocale()});
	} else {
		res.render('login');
	}
});

router.get('/:event(@[A-Z0-9a-záéíóúàèìòùäëïöüÿâêîôûçœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇŒÃÕÑß]+)', function(req, res) {
	if (req.isAuthenticated()) {
		res.render('index', { user: req.session.jUser, locale: req.getLocale(), url: req.params.event, reqType: 'event'});
	} else {
		res.render('login');
	}
});

router.get('/:user([a-zA-Z]+-+[0-9a-fA-F]{6})', function(req, res) {
	if (req.isAuthenticated()) {
		res.render('index', { user: req.session.jUser, locale: req.getLocale(), url: req.params.user, reqType: 'user'});
	} else {
		res.render('login');
	}
});

module.exports = router;
