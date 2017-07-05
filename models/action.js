var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;
var FB = require('fb');

var PostSchema = new Schema({
	tag: {type: String, es_indexed: true},
	originalTag: String,
	geo: { type: [Number], index: '2d', es_indexed: true, es_type: 'geo_point' },
	media: String,
	active: { type: Boolean, es_indexed: true },
	authorId : { type: String, es_indexed: true },
	tagId: { type: String, es_indexed: true },
	createdAt: { type: Date, default: Date.now, es_indexed: true },
	reportedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

PostSchema.plugin(mongoosastic, {
	hosts: ['localhost:9200'], hydrate:true, hydrateOptions: {lean: true}
});

PostSchema.statics.sharePostOnFb = function (req, callback, error) {
	var str = req.body; //req.body es 420.jpg
	var res = str.split(".");
	
	var url = 'https://' + window.location.hostname + ':' + window.location.port + '/uploads/' + res[0] + '.' + res[1];
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
					error();
				}
			}
	);
}

PostSchema.statics.reportPost = function (post, userId, callback, error) {
	if(post.author.id != userId) {
		var User = mongoose.model('User');
		this.update({ _id: post.id }, { $push: { reportedBy: userId }}, function (err, doc) {
			if (err) error();
			console.log('accion reportada con éxito');
			console.log(doc);
			User.update({ _id: userId }, { $push: { reportedPosts: post.id }}, function (err, doc) {
				if (err) error();
				console.log('accion reportada referenciada a user');
				console.log(doc);
			});
		});
	}
	callback();
}

PostSchema.statics.deletePost = function (post, userId, callback, error) {
	if(post.author.id == userId) {
		this.update({ _id: post.id }, { $set: { active: false }}, function (err, doc) {
			if (err) error();
			console.log('accion borrada con éxito');
			console.log(doc);
		});
	}
	callback();
}

PostSchema.statics.savePost = function (post, userId, callback, error) {
	if(post.author.id != userId) {
		var User = mongoose.model('User');
		User.update({ _id: userId }, { $push: { savedPosts: post.id }}, function (err, doc) {
			if (err) error();
			console.log('accion guardada con éxito en savedPosts');
			console.log(doc);
		});
	}
	callback(post);
}

PostSchema.statics.unsavePost = function (post, userId, callback, error) {
	if(post.author.id != userId) {
		var User = mongoose.model('User');
		User.update({ _id: userId }, { $pull: { savedPosts: post.id }}, function (err, doc) {
			if (err) error();
			console.log('accion removida de savedPosts');
			console.log(doc);
		});
	}
	callback();
}

module.exports = mongoose.model('Post', PostSchema);