var express = require('express');
var router = express.Router();
var service = require('../services');

/* GET router para '/login'
 * Si el usuario NO está autenticado, renderiza la vista 'login.jade'; de lo
 * contrario redirecciona a la ruta '/account'.
 */
router.get('/', function(req, res){
  if (req.isAuthenticated()) {
  	res.status(200).json({token: service.createToken(req.user)});
  } else {
		res.render('login');
  }
});

module.exports = router;
