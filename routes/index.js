var express = require('express');
var router = express.Router();

/* GET router para '/'
 * Renderiza la vista 'index.jade'
 */
router.get('/', function(req, res){
  res.render('index', { title: 'Express', user: req.user });
});

module.exports = router;
