var express = require('express');
var router = express.Router();

var ensureAuthenticated = require('./ensureAuth');

// Clases jPack
var jPack = require('../jPack');

// Conección con Parse
var Parse = require('../parseConnect').Parse;

var request = require('request');

//Guardar archivos
var fs = require('fs');
var sys = require('sys');

router.post('/', ensureAuthenticated, function(req, res) {
	// string generated by canvas.toDataURL()
	var img = req.body.image;
	// strip off the data: url prefix to get just the base64-encoded bytes
	var data = img.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	fs.writeFile('./public/uploads/image.jpg', buf);
	res.status(201).end();
});

module.exports = router;
