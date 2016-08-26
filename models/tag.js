var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fs = require('fs');
var FB = require('fb');

require('./action');
require('./user');

var TagSchema = new Schema({
	name: String,
	originalName : String,
	actions : [{ type: Schema.Types.ObjectId, ref: 'Action' }],
	createdAt: {type: Date, default: Date.now}
});

/*TagSchema.statics.getActionsByTag = function (tagName, callback) {
	return this.findOne({name: tagName})
					.populate('actions')
					.exec(callback)
}*/

TagSchema.statics.getActionsByTag = function (req, callback, error) {
	/*var point = {};
	if(req.session.coords != undefined) {
		point.latitude = req.session.coords.latitude;
		point.longitude = req.session.coords.longitude;
	} else { // Arequipa
		point.latitude = -16.3989;
		point.longitude = -71.535;
	}*/

	var resultsLimit = 10;
	var queryNumber = 0;
	var queryTimeLimitStep = 24*20;
	var countActions;

	if(req.params.i!=undefined) {
		queryNumber = parseInt(req.params.i);
	} else {
		req.session.queryTimeLimit = queryTimeLimitStep;
	}

	var simpleEventName = req.session.path[2];
	var diacritics =[
		/[\300-\306]/g, /[\340-\346]/g,  // A, a
		/[\310-\313]/g, /[\350-\353]/g,  // E, e
		/[\314-\317]/g, /[\354-\357]/g,  // I, i
		/[\322-\330]/g, /[\362-\370]/g,  // O, o
		/[\331-\334]/g, /[\371-\374]/g,  // U, u
		/[\321]/g, /[\361]/g, // N, n
		/[\307]/g, /[\347]/g, // C, c
	];
	var chars = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
	for (var i = 0; i < diacritics.length; i++) {
		simpleEventName = simpleEventName.replace(diacritics[i],chars[i]);
	}
	var tagName = simpleEventName.toLowerCase();
	this.findOne({name: tagName})
	.populate({
		path: 'actions',
		match: {active: true},
		options: {skip: resultsLimit*queryNumber, limit: resultsLimit, sort: { createdAt: -1 }}
	})
	.exec(function (err, tag) {
		if (err) return handleError(err);
		if(tag != null) {
			callback(tag.actions);
		} else {
			console.log('NO EXISTE tal tag');
			error();
		}
	})
}

TagSchema.statics.newAction = function (req, userId, callback) { //revisar si estoy enviando función error
	var Action = mongoose.model('Action');
	var User = mongoose.model('User');
	var newAction = req.body;
	var simpleTag = simplifyName(newAction.tag);
	var mediaName = parseInt(Math.random(255,2)*10000);
	var mediaExt = 'jpg';
	var FB = require('fb');
	if( newAction.coords == undefined ) {
		newAction.coords = {};
		newAction.coords.latitude = -16.3989;
		newAction.coords.longitude = -71.535;
	}
	var coords = [];
	coords[0] = newAction.coords.latitude;
	coords[1] = newAction.coords.longitude;
	this.findOne({name: simpleTag}, function(err, tag) {
		var objectTag = tag;
		saveMedia(newAction.media, mediaName, mediaExt);
		if(err) throw(err);
		console.log(coords);
		var action = new Action({
			name: newAction.tag,
			geo: coords,
			media: mediaName + '.' + mediaExt,
			active: true,
			authorId: userId
		});
		action.save(function(err) {
			if(err) throw err;
			User.update({ _id: userId }, { $push: { actions: action._id }}, function (err, doc) {
				if (err) return handleError(err);
				console.log('accion referenciada a user');
				console.log(doc);
			});
			if(objectTag!= null) {
				Action.update({ _id: action._id }, { $set: { tagId: objectTag._id }}, function (err, doc) {
					if (err) return handleError(err);
				});
				objectTag.actions.push(action._id);
				objectTag.save();
				console.log('Acción referenciada a tag');
			} else {
				var Tag = mongoose.model('Tag', TagSchema);
				var tag = new Tag();
				tag.name = simpleTag;
				tag.originalName = newAction.tag;
				tag.actions = action._id;
				tag.save(function (err) {
					if (err) return handleError(err);
					Action.update({ _id: action._id }, { $set: { tagId: tag._id }}, function (err, doc) {
						if (err) return handleError(err);
					});
					console.log('Tag guardado y acción referenciada');
				});
				callback();
			}
		});
		if(newAction.shareOnFb) {
			var url = 'http://juaku-dev.cloudapp.net:3000/uploads/' + mediaName + '.' + mediaExt;
			shareMediaOnFb(req, url);
		}
		function shareMediaOnFb(req, url) {
			var albumId = '';
			FB.api('/' + albumId + '/photos','POST',
				{
					'url': url,
					'access_token': req.session.accessToken
				},
					function (response) {
						if (response && !response.error) {
							// handle the result
							console.log('Foto compartida en facebook exitósamente');
						} else {
							console.log('Error, foto no compartida');
						}
					}
			);
		}
	});
	function saveMedia(data, name, ext) {
		console.log('saveMedia');
		var img = data;
		// Strip off the data: url prefix to get just the base64-encoded bytes
		var data = img.replace(/^data:image\/\w+;base64,/, "");
		var buf = new Buffer(data, 'base64');
		// TODO: Verificación de archivo
		fs.writeFile('./public/uploads/'+ name +'.'+ ext, buf);
		console.log('IMAGEN GUARDADA EN SERVIDOR!!!!!!!!');
		//next(data); || return data;
	}
}

TagSchema.statics.editTag = function (req, userId, callback) { //revisar si estoy enviando función error
	var Action = mongoose.model('Action');
	var User = mongoose.model('User');
	var action = req.body;
	var newSimpleTag = simplifyName(action.tag);
	var oldSimpleTag = simplifyName(action.oldTag);
	var FB = require('fb');
	if(action.author.id == userId && oldSimpleTag != newSimpleTag && newSimpleTag != '' && newSimpleTag != undefined) {
		//Remueve ACTION referenciada a TAG antiguo
		this.update({ name: oldSimpleTag }, { $pull: { actions: action.id }}, function (err, doc) {
			if (err) return handleError(err);
			console.log('accion removida de tag: ' + oldSimpleTag);
			console.log(doc);
		});
		//Cambia nombre de TAG dentro de ACTION
		Action.update({ _id: action.id }, { $set: { name: action.tag }}, function (err, doc) {//declarar newName
			if (err) return handleError(err);
			console.log('Actualización de tag en action: ' + newSimpleTag);
			console.log(doc);
		});
		//Referencia ACTION a nuevo TAG
		this.findOne({name: newSimpleTag}, function(err, objectTag) {
			if(err) throw err;
			if(objectTag!= null) {
				Action.update({ _id: action.id }, { $set: { tagId: objectTag._id }}, function (err, doc) {
					if (err) return handleError(err);
				});
				objectTag.actions.push(action.id);
				objectTag.save();
				console.log('Acción referenciada a tag');
			} else {
				var Tag = mongoose.model('Tag', TagSchema);
				var tag = new Tag();
				tag.name = newSimpleTag;
				tag.originalName = action.tag;
				tag.actions = action.id;
				tag.save(function (err) {
					if (err) return handleError(err);
					Action.update({ _id: action.id }, { $set: { tagId: tag._id }}, function (err, doc) {
						if (err) return handleError(err);
					});
					console.log('Tag guardado y acción referenciada');
				});
			}
		});
		callback();
	}
}

function simplifyName(tag) {
	console.log('simplifyName ' + tag);
	var diacritics =[
		/[\300-\306]/g, /[\340-\346]/g,  // A, a
		/[\310-\313]/g, /[\350-\353]/g,  // E, e
		/[\314-\317]/g, /[\354-\357]/g,  // I, i
		/[\322-\330]/g, /[\362-\370]/g,  // O, o
		/[\331-\334]/g, /[\371-\374]/g,  // U, u
		/[\321]/g, /[\361]/g, // N, n
		/[\307]/g, /[\347]/g, // C, c
	];
	var chars = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
	for (var i = 0; i < diacritics.length; i++) {
		tag = tag.replace(diacritics[i],chars[i]);
	}
	return tag.toLowerCase();
}

module.exports = mongoose.model('Tag', TagSchema);