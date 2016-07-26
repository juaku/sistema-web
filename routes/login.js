var express = require('express');
var router = express.Router();

/* GET router para '/login'
 * Si el usuario NO está autenticado, renderiza la vista 'login.jade'; de lo
 * contrario redirecciona a la ruta '/account'.
 */
router.get('/', function(req, res){
  if (req.isAuthenticated()) {
    res.render('index');
  } else {
    res.render('login');
  }
});

module.exports = router;
