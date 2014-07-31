var express = require('express');
var router = express.Router();

/* GET router para '/logout'
 * Borra la cookie, sale de la sesión y redirecciona a '/'.
 */
router.get('/', function(req, res){
  res.clearCookie('locale');
  req.logout();
  res.redirect('/');
});

module.exports = router;
