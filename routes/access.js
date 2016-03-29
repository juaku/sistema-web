var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var ensureAuthenticated = require('./ensureAuth');

// Clase jPack
var jPack = require('../jPack');
var FB = require('fb');

/*
 * GET router para '/access' 
 * Autentica al usuario y crea un jUser y lo loguea/registra en Parse.com
 */
router.get('/', ensureAuthenticated, function(req, res) {

	/*var User = mongoose.model('User');
	User.findOne({provider_id: profile.id}, function(err, user) {
		if(err) throw(err);
		if(!err && user!= null) {

		var user = new User({
		provider_id: profile.id,
		provider: profile.provider,
		name: profile.displayName,
		photo: profile.photos[0].value
		});
		user.save(function(err) {
		if(err) throw err;
		done(null, user);
		});
		});
	}*/

	console.log('req.session');
	console.log(req.session);

	res.render('access', { user: req.user});

// var Cat = mongoose.model('Cat', { name: String });

// var kitty = new Cat({ name: 'Zildjian' });
// kitty.save(function (err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log('meow');
//   }
// });
	/*req.session.jUser = new jPack.user ({
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
*/
	// Establecer 'Locale'
	/*var locale = jUser.locale.split('_')[0];
	res.cookie('locale', locale, { maxAge: 1000*60*60*24*15, httpOnly: true });*/

	// Loguear al usuario en Parse
	/*jUser.signUp(req.session, function() {
		jUser.getProfilePicture(req.session, function() {
			res.render('access', { user: req.user});
		});
	}, function(error) {
		res.redirect('/login');
	});*/
	
});

module.exports = router;
