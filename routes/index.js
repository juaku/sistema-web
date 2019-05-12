var express = require('express');
var router = express.Router();

/* GET router para '/'
 * Renderiza la vista 'index.jade' y devuelve datos de usuario si es que el jwt está definido
 * está logueado o no
 */
router.get('/', function(req, res) {
	res.render('index', { user: JSON.stringify(req.user), locale: req.getLocale(), token: req.session.token });
});

router.get('/:path((([0-9A-Fa-f]{3})(\.+[A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,}))?(?:@([0-9A-Za-záéíóúàèìòùäëïöüÿâêîôûçæœãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜŸÂÊÎÔÛÇÆŒÃÕÑß%]{3,}))?$)', function(req, res) {
	res.render('index', { user: JSON.stringify(req.user), locale: req.getLocale(), url: req.params.path, reqType: 'path', token: req.session.token });
});

router.get('/privacy', function(req, res) {
	res.render('privacy');
});

module.exports = router;