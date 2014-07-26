var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

/* GET router para '/account'
 * Autentica al usuario y carga la vista 'account.jade'
 */
router.get('/', ensureAuthenticated, function(req, res) {
  res.render('account', { user: req.user });
});

module.exports = router;
