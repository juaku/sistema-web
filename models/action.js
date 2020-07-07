var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;
var FB = require('fb');

var PostSchema = new Schema({
	simpleTag: {type: String, es_indexed: true},
	tag: String,
	geo: { type: [Number], index: '2d', es_indexed: true, es_type: 'geo_point' },
	media: String,
	city: String,
	country: String,
	active: { type: Boolean, default: true, es_indexed: true },
	authorId : { type: String, es_indexed: true },
	tagId: { type: String, es_indexed: true },
	createdAt: { type: Date, default: Date.now, es_indexed: true },
	reportedBy: [{ type: Schema.Types.ObjectId, ref: 'User', es_indexed: true, es_type: 'nested', es_include_in_parent: true}]
});

PostSchema.plugin(mongoosastic, {
	hosts: ['localhost:9200'], populate: [ {path: 'reportedBy', select: 'firstName lastName'} ], hydrate:true, hydrateOptions: {lean: true}
});

PostSchema.statics.sharePostOnFb = function (req, callback, error) {
	//var str = req.body; //req.body es 420.jpg
	//var res = str.split(".");
	var url = 'https://juaku-dev.cloudapp.net:5000' + req.body.media;
	console.log('url! ');
	console.log(url);
	console.log(req.session.passport.user.accessToken);
	var albumId = '';
	FB.api('/' + albumId + '/photos','POST',
		{
			'url': url,
			'access_token': req.session.passport.user.accessToken
		},
			function (response) {
				if (response && !response.error) {
					console.log('Foto compartida en facebook exitósamente');
					callback();
				} else {
					console.log('ERROR COMPARTIENDO FOTO EN FB'); //no se puede compartir la foto por el certificado ssl
					console.log(response.error);
					error();
				}
			}
	);
}

// $addToSet no agrega el elemento al campo dado si ya lo contiene, por otro lado $push agregará el objeto dado al campo si existe o no
PostSchema.statics.reportPost = function (req, callback, error) {
	var post = req.body;
	var currentUserId = req.session.idMongoDb;
	if(post.author.id != currentUserId) {
		var User = mongoose.model('User');
		// findOneAndUpdate de mongoose actualizará automáticamente la data dentro de elastic siempre y cuando new: true esté seteado en las opciones
		this.findOneAndUpdate({ _id: post.id }, { $addToSet: { reportedBy: currentUserId }}, { new: true }, function (err, doc) {
			if (err) error();
			console.log('post reportado con éxito');
			console.log(doc);
			User.update({ _id: currentUserId }, { $addToSet: { reportedPosts: post.id }}, function (err, doc) {
				if (err) error();
				console.log('post reportado referenciada a user');
				console.log(doc);
			});
		});
	}
	callback();
}

PostSchema.statics.unReportPost = function (req, callback, error) {
	var post = req.body;
	var currentUserId = req.session.idMongoDb;
	if(post.author.id != currentUserId) {
		var User = mongoose.model('User');
		this.findOneAndUpdate({ _id: post.id }, { $pull: { reportedBy: currentUserId }}, { new: true }, function (err, doc) {
			if (err) error();
			console.log('este post ya no está reportado');
			console.log(doc);
			User.update({ _id: currentUserId }, { $pull: { reportedPosts: post.id }}, function (err, doc) {
				if (err) error();
				console.log(doc);
			});
		});
	}
	callback();
}

PostSchema.statics.deletePost = function (req, callback, error) {
	var post = req.body;
	var currentUserId = req.session.idMongoDb;
	if(post.author.id == currentUserId) {
		this.findOneAndUpdate({ _id: post.id }, { $set: { active: false }}, { new: true }, function (err, doc) {
			if (err) error();
			console.log('Post desactivado con éxito');
			console.log(doc);
			callback();
		});
	}
}

PostSchema.statics.savePost = function (req, callback, error) {
	var post = req.body;
	var currentUserId = req.session.idMongoDb;
	if(post.author.id != currentUserId) {
		console.log('savePost');
		var User = mongoose.model('User');
		User.update({ _id: currentUserId }, { $push: { savedPosts: post.id }}, function (err, doc) {
			if (err) error();
			console.log('post guardada con éxito en savedPosts');
			console.log(doc);
		});
	}
	callback(post);
}

PostSchema.statics.unsavePost = function (req, callback, error) {
	var post = req.body;
	var currentUserId = req.session.idMongoDb;
	if(post.author.id != currentUserId) {
		console.log('unsavePost');
		var User = mongoose.model('User');
		User.update({ _id: currentUserId }, { $pull: { savedPosts: post.id }}, function (err, doc) {
			if (err) error();
			console.log('post removida de savedPosts');
			console.log(doc);
		});
	}
	callback();
}

module.exports = mongoose.model('Post', PostSchema);