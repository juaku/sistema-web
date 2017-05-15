var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var ensureAuthenticated = require('./ensureAuth');

var jwt = require('jsonwebtoken');
var config = require('../config');

/*
 * GET router para '/access' 
 */
router.get('/', ensureAuthenticated, function(req, res) {
	// TODO: LIBERAR. Establecer 'Locale'
	// Crear token
	req.session.token = jwt.sign(
		{ id: req.user.id },
		config.tokenSecret,
		{ expiresIn : 60*60*24*15 /* 15 Días */}
  	);
	// Registrar al usuario, si lo está devolverá datos de usuario
	var User = mongoose.model('User');
	User.signUp(req, function() {
		res.render('access', { user: req.user});
	}, function(error) {
		res.redirect('/login');
	});
	
});

module.exports = router;
