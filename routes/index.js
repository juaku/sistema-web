var express = require('express');
var router = express.Router();

/* GET router para '/'
 * Renderiza la vista 'index.jade' o la 'login.jade' dependiendo si el usuario
 * está logueado o no
 */
router.get('/', function(req, res){
	if (req.isAuthenticated()) {
		res.render('index', { title: 'Express', user: req.user });
	} else {
		res.render('login');
	}
});

module.exports = router;
