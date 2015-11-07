var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clase jPack
var jPack = require('../jPack');
var FB = require('fb');

/*
 * GET router para '/access'
 * Autentica al usuario y crea un jUser y lo loguea/registra en Parse.com
 */
router.get('/', ensureAuthenticated, function(req, res) {
	req.session.jUser = new jPack.user ({
		id : req.user.id,
		firstName : req.user.name.givenName,
		lastName : req.user.name.familyName,
		email : req.user._json.email,
		birthday : req.user._json.birthday,
		gender : req.user.gender,
		locale : req.user._json.locale,
		facebookUrl : req.user.profileUrl,
		accessToken : req.user.accessToken,
		expires : req.session.cookie._expires
	});

	
	var jUser = req.session.jUser;

	// Establecer 'Locale'
	var locale = jUser.locale.split('_')[0];
	res.cookie('locale', locale, { maxAge: 1000*60*60*24*15, httpOnly: true });

	// Loguear al usuario en Parse
	jUser.signUp(req.session, function() {
		jUser.getProfilePicture(req.session, function() {
			res.render('access', { user: req.user});
		});
	}, function(error) {
		res.redirect('/login');
	});
	
});

module.exports = router;
