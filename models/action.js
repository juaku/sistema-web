var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var FB = require('fb');

var ActionSchema = new Schema({
	name: String,
	geo: { type: [Number], index: '2d'},
	media: String,
	active: Boolean,
	authorId : String,
	tagId: String,
	createdAt: {type: Date, default: Date.now},
	reportedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

ActionSchema.statics.getActions = function (req, callback, error) {
	var resultsLimit = 20;
	var queryNumber = 0;
	if(req.params.i!=undefined) {
		queryNumber = parseInt(req.params.i);
	}
	this.find({
		active: true,
		geo: {
			$near: {
				$geometry: {type: "Point",  coordinates: [req.session.coords.longitude, req.session.coords.latitude]}
			}
		}
	})
	.limit(resultsLimit)
	.skip(resultsLimit * queryNumber)
	.exec(function (err, action) {
		if (err) error();
		callback(action);
	})
}

ActionSchema.statics.shareActionOnFb = function (req, callback, error) {
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

ActionSchema.statics.reportAction = function (action, userId, callback, error) {
	if(action.author.id != userId) {
		var User = mongoose.model('User');
		this.update({ _id: action.id }, { $push: { reportedBy: userId }}, function (err, doc) {
			if (err) error();
			console.log('accion reportada con éxito');
			console.log(doc);
			User.update({ _id: userId }, { $push: { reportedActions: action.id }}, function (err, doc) {
				if (err) error();
				console.log('accion reportada referenciada a user');
				console.log(doc);
			});
		});
	}
	callback();
}

ActionSchema.statics.deleteAction = function (action, userId, callback, error) {
	if(action.author.id == userId) {
		this.update({ _id: action.id }, { $set: { active: false }}, function (err, doc) {
			if (err) error();
			console.log('accion borrada con éxito');
			console.log(doc);
		});
	}
	callback();
}

ActionSchema.statics.saveAction = function (action, userId, callback, error) {
	if(action.author.id != userId) {
		var User = mongoose.model('User');
		User.update({ _id: userId }, { $push: { savedActions: action.id }}, function (err, doc) {
			if (err) error();
			console.log('accion guardada con éxito en savedActions');
			console.log(doc);
		});
	}
	callback();
}

ActionSchema.statics.unsaveAction = function (action, userId, callback, error) {
	if(action.author.id != userId) {
		var User = mongoose.model('User');
		User.update({ _id: userId }, { $pull: { savedActions: action.id }}, function (err, doc) {
			if (err) error();
			console.log('accion removida de savedActions');
			console.log(doc);
		});
	}
	callback();
}

module.exports = mongoose.model('Action', ActionSchema);