//Predeterminado de express
var express = require('express');
var config = require('./config');
var session = require('express-session');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Ya no se requiere
//Multer multipart/form-data
//var multer = require('multer');

//Stylus y Nib
var stylus = require('stylus')
var nib = require('nib');

//Coneccion con Facebook
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy;

// Concección con MongoDB
var db = require('./mongodbConnect');

//Sesion permanente
var redisStore = require('connect-redis')(session);
var utils = require('./utils');

//i18n
var i18n = require("i18n");

i18n.configure({
	locales: ['en', 'es'],
	cookie: 'locale',
	directory: __dirname + '/locales'
});

//Codigos de aplicación de Facebook
var FACEBOOK_APP_ID = config.facebook.id;
var FACEBOOK_APP_SECRET = config.facebook.secret;

//Serialización de sesión
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

// TODO: Verificar si este bloque es necesario
/*
//Token
var tokens = {}

function saveRememberMeToken(token, uid, fn) {
	tokens[token] = uid;
	return fn();
}
*/
// END TODO

//FacebookStrategy
passport.use(new FacebookStrategy({
	clientID: FACEBOOK_APP_ID,
	clientSecret: FACEBOOK_APP_SECRET,
	callbackURL: 'http://juaku-dev.cloudapp.net:' +  (process.env.PORT || 3000) + '/auth/facebook/callback',
	passReqToCallback: true
},
function(req, accessToken, refreshToken, profile, done) {
    // TODO: Ver si sirve nextTick
    // verificación asíncrona, para el efecto de ... 

    process.nextTick(function () {
    	profile.accessToken = accessToken;
      // Para mantener el ejemplo sencillo, el perfil de Facebook del usuario se devuelve para
      // representar al usuario logueado. En una aplicación típica que quieras 
      // asociar la cuenta de Facebook con un registro de usuario en su base de datos,
      // y devolver ese usuario en su lugar.
      return done(null, profile);
    });
	
	//req.session.accessToken = accessToken;
	
	/*var User = mongoose.model('User');

	User.findOne({providerId: profile.id}, function(err, user) {
		if(err) throw(err);
		if(!err && user!= null) return done(null, user);

		var user = new User({
			providerId: profile.id,
			provider: profile.provider,
			name: profile.name.givenName,
			familyName: profile.name.familyName,
			userName: profile.name.givenName,
			//photo: profile.photos[0].value
		});
		
		user.save(function(err) {
			if(err) throw err;
			done(null, user);
		});
	});*/
}));

// TODO: Verificar si este bloque es necesario
/*
function issueToken(user, done) {
	var token = utils.randomString(64);
	saveRememberMeToken(token, user.id, function(err) {
		if (err) { return done(err); }
		return done(null, token);
	});
}*/
// END TODO

var access = require('./routes/access');
var login = require('./routes/login');
var logout = require('./routes/logout');
var post = require('./routes/post');
var user = require('./routes/user');
var list = require('./routes/list');
var routes = require('./routes/index');

var app = express();

// Inicializar Nib
function compile(str, path) {
	return stylus(str)
		.set('filename', path)
		.set('compress', false)		// .css final comprimido en una linea
		.use(nib());
}

// ver configuración de motor
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: "R4y6G5j7D3c3R4273092", store: new redisStore({
	host: 'localhost',
	port: '6379'
}), cookie: { path: '/', maxAge: 1000*60*60*24*2 }, // 2 Días
	resave: false,
	saveUninitialized: false
}));

//NO CACHE
/*app.use(function(req, res, next) {
  req.headers['if-none-match'] = 'no-match-for-this';
  next();    
});*/

// Usar Multer - Ya no se require
//app.use(multer({ dest: './public/uploads/'}));

// Inicializar Passport!  También use el middleware passport.session(), para apoyar
// Sesiones de inicio de sesión persistentes (recomendado).
app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

//Inicializar i18n
app.use(i18n.init);

//Título de aplicación
app.locals.title = 'Juaku';

//DEV: Restringir el uso a usuarios que no sean clientes del servidor
if (app.get('env') === 'development') {
	app.use(function(req, res, next) {
		//if(req.ip == process.env.SSH_CLIENT.split(' ')[0] || req.ip == '191.238.45.128' || req.ip.substring(0, 11) == '190.113.211' || req.ip.substring(0, 11) == '190.113.210') {
		if(req.ip == process.env.SSH_CLIENT.split(' ')[0] || req.ip == '::ffff:200.48.179.114' || (parseInt(req.ip.split('.')[0]) == 179 && parseInt(req.ip.split('.')[1]) == 7)) {
			next();
		} else {
			console.log('Acceso denegado para: ' + req.ip )
			res.status(403).end();
		}
	});
}

//Usar rutas
app.use('/access', access);
app.use('/login', login);
app.use('/logout', logout);
app.use('/post', post);
app.use('/user', user);
app.use('/list', list);
app.use('/', routes);

// GET /auth/facebook
//   Use passport.authenticate() como una ruta middleware para autenticar la
//   petición.  El primero paso en la auntenticación de Facebook implicará
//   redirigir al usuario a facebook.com.  Después de la autorizacón, Facebook
//   redirigirá al usuario a esta aplicación at /auth/facebook/callback
app.get('/auth/facebook',
	passport.authenticate('facebook', { scope: ['user_birthday', 'user_photos', 'user_events', 'read_friendlists', 'email', 'publish_actions'], failureRedirect: '/login', display: 'popup'  }),
	function(req, res){
    // La petición será redirigida a Facebook para la autenticación, por lo que
    // esta función no se llamará.
});

// GET /auth/facebook/callback
//   Use passport.authenticate() como una ruta middleware para autenticar la
//   petición.  Si la autenticación falla, el usuario será redirigido a la
//   página de inicio de sesión.  De lo contrario, la función de la ruta principal se llamará
//   el cual, en este ejemplo, se redirigirá al usuario a la página de inicio.
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {failureRedirect: '/login' }),
	function(req, res, next) {
    // Emite un remember me cookie si la opción se aprobó
    // if (!req.body.remember_me) { return next(); }

    next();  // Si el bloque de abajo no es necesario
    // TODO: Verificar si este bloque es necesario
		/*
    issueToken(req.user, function(err, token) {
    	if (err) { return next(err); }
    	res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 604800000 });
    	return next();
    });*/
		// END TODO
},
function(req, res, next) {
	res.redirect('/access');
}
);

/// captura un 404 y reenvia un error al manejador
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// controladores de errores

// controlador de errores de desarrollo
// imprimirá stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// controlador de errores de producción
// ningún stacktraces filtró al usuario
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;
