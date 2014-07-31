var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clase jPack
var jPack = require('../jPack');

/*
 * GET router para '/access'
 * Autentica al usuario y crea un jUser y lo loguea/registra en Parse.com
 */
router.get('/', ensureAuthenticated, function(req, res) {
	var passportUser = req.session.passport.user;
	req.session.jUser = new jPack.user ({
		id : req.session.passport.user.id,
		firstName : passportUser.name.givenName,
		lastName : passportUser.name.familyName,
		email : passportUser._json.email,
		birthday : passportUser._json.birthday,
		gender : passportUser.gender,
		location : passportUser._json.location,
		hometown : passportUser._json.hometown,
		locale : passportUser._json.locale,
		facebookUrl : passportUser.profileUrl,
		accessToken : passportUser.accessToken,
		expires : req.session.cookie._expires
	});

	var jUser = req.session.jUser;

	// Establecer 'Locale'
	var locale = jUser.locale.split('_')[0];
	res.cookie('locale', locale, { maxAge: 1000*60*60*25*15, httpOnly: true });

	// Loguear al usuario en Parse
	jUser.signUp(req.session, function() {
		res.render('access', { user: req.user });
	}, function(error) {
		res.redirect('/login');
	});
});

module.exports = router;
