var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fs = require('fs');
var FB = require('fb');

require('./action');
require('./user');

var TagSchema = new Schema({
	tag: String,
	posts : [{ type: Schema.Types.ObjectId, ref: 'Post' }],
	createdAt: {type: Date, default: Date.now}
});

TagSchema.statics.getPostsByTag = function (req, callback, error) {
	var resultsLimit = 20;
	var queryNumber = 0;
	if(req.params.i!=undefined) {
		queryNumber = parseInt(req.params.i);
	}
	var tag = req.session.path;
	this.findOne({tag: tag})
	.populate({
		path: 'posts',
		match: {active: true, geo: {$near: {$geometry: {type: "Point",  coordinates: [req.session.coords.longitude, req.session.coords.latitude]}}}},
		options: {skip: resultsLimit*queryNumber, limit: resultsLimit}
	})
	.exec(function (err, tag) {
		if (err) return handleError(err);
		if(tag != null) {
			callback(tag.posts);
		} else {
			console.log('NO EXISTE tal tag');
			error();
		}
	})
}

TagSchema.statics.newPost = function (req, userId, callback, error) {
	var Post = mongoose.model('Post');
	var User = mongoose.model('User');
	var newPost = req.body;
	var mediaName = parseInt(Math.random(255,2)*10000);
	var mediaExt = 'jpg';
	var FB = require('fb');
	if( newPost.coords == undefined ) {
		newPost.coords = {};
		newPost.coords.latitude = -16.3989;
		newPost.coords.longitude = -71.535;
	}
	var coords = [];
	coords[0] = newPost.coords.latitude;
	coords[1] = newPost.coords.longitude;
	this.findOne({tag: newPost.tagSimple}, function(err, tag) {
		var objectTag = tag;
		saveMedia(newPost.media, mediaName, mediaExt);
		if(err) throw(err);
		console.log(coords);
		var post = new Post({
			tag: newPost.tagSimple,
			originalTag: newPost.tag,
			geo: coords,
			media: mediaName + '.' + mediaExt,
			active: true,
			authorId: userId
		});
		post.save(function(err) {
			if(err) error();
			User.update({ _id: userId }, { $push: { posts: post._id }}, function (err, doc) {
				if (err) error();
				console.log('accion referenciada a user');
				console.log(doc);
			});
			if(objectTag!= null) {
				Post.update({ _id: post._id }, { $set: { tagId: objectTag._id }}, function (err, doc) {
					if (err) error();
				});
				objectTag.posts.push(post._id);
				objectTag.save();
				console.log('Acción referenciada a tag');
			} else {
				var Tag = mongoose.model('Tag', TagSchema);
				var tag = new Tag();
				tag.tag = newPost.tagSimple;
				tag.posts = post._id;
				tag.save(function (err) {
					if (err) error();
					Post.update({ _id: post._id }, { $set: { tagId: tag._id }}, function (err, doc) {
						if (err) error();
					});
					console.log('Tag guardado y acción referenciada');
				});
				callback();
			}
		});
		if(newPost.shareOnFb) {
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

TagSchema.statics.editTag = function (post, userId, callback, error) {
	var Post = mongoose.model('Post');
	var User = mongoose.model('User');
	var newSimpleTag = simplifyName(post.tag);
	var oldSimpleTag = simplifyName(post.oldTag);
	var FB = require('fb');
	if(post.author.id == userId && oldSimpleTag != newSimpleTag && newSimpleTag != '' && newSimpleTag != undefined) {
		//Remueve POST referenciado a TAG antiguo
		this.update({ name: oldSimpleTag }, { $pull: { posts: post.id }}, function (err, doc) {
			if (err) error();
			console.log('accion removida de tag: ' + oldSimpleTag);
			console.log(doc);
		});
		//Cambia nombre de TAG dentro de POST
		Post.update({ _id: post.id }, { $set: { name: post.tag }}, function (err, doc) {
			if (err) error();
			console.log('Actualización de tag en post: ' + newSimpleTag);
			console.log(doc);
		});
		//Referencia POST a nuevo TAG
		this.findOne({name: newSimpleTag}, function(err, objectTag) {
			if(err) throw err;
			if(objectTag!= null) {
				Post.update({ _id: post.id }, { $set: { tagId: objectTag._id }}, function (err, doc) {
					if (err) error();
				});
				objectTag.posts.push(post.id);
				objectTag.save();
				console.log('Acción referenciada a tag');
			} else {
				var Tag = mongoose.model('Tag', TagSchema);
				var tag = new Tag();
				tag.name = newSimpleTag;
				tag.posts = post.id;
				tag.save(function (err) {
					if (err) error();
					Post.update({ _id: post.id }, { $set: { tagId: tag._id }}, function (err, doc) {
						if (err) error();
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