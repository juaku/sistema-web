var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var FB = require('fb');

var PostSchema = new Schema({
	tag: String,
	originalTag: String,
	geo: { type: [Number], index: '2d'},
	media: String,
	active: Boolean,
	authorId : String,
	tagId: String,
	createdAt: {type: Date, default: Date.now},
	reportedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

PostSchema.statics.getPosts = function (req, callback, error) {
	var resultsLimit = 20;
	var queryNumber = 0;
	if(req.params.i!=undefined) {
		queryNumber = parseInt(req.params.i);
	}
	this.find({
		active: true,
		geo: { $geoWithin: {$center: [[req.session.coords.longitude, req.session.coords.latitude], 500]} }
	})
	.sort({createdAt: -1})
	.limit(resultsLimit)
	.skip(resultsLimit * queryNumber)
	.exec(function (err, posts) {
		if (err) error();
		callback(posts);
	})
}

PostSchema.statics.sharePostOnFb = function (req, callback, error) {
	var str = req.body; //req.body es 420.jpg
	var res = str.split(".");
	
	var url = 'http://juaku-dev.cloudapp.net:5000/uploads/' + res[0] + '.' + res[1];
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