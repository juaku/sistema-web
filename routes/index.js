var express = require('express');
var router = express.Router();

/* GET router para '/'
 * Renderiza la vista 'index.jade'
 */
router.get('/', function(req, res){
	if (req.isAuthenticated()) {
		res.render('index', { title: 'Express', user: req.user });
	} else {
		res.redirect('/login');
	}
});

module.exports = router;
