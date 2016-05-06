var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var FB = require('fb');
require('./user');

var ActionSchema = new Schema({
	name: String,
	geo: { type: [Number], index: '2d'},
	media: String,
	active: Boolean,
	authorId : String,
	createdAt: {type: Date, default: Date.now}
});

/*ActionSchema.statics.getActions = function (resultsLimit, queryNumber, callback) {
	return this.find({})
					.sort({createdAt: -1})
					.skip(resultsLimit * queryNumber)
					.limit(resultsLimit)
					.exec(callback)
}*/

ActionSchema.statics.getActions = function (req, callback, error) {
	var User = mongoose.model('User');
	var posts = [];
	var point = {};
	if(req.session.jUser.coords != undefined) {
		point.latitude = req.session.jUser.coords.latitude;
		point.longitude = req.session.jUser.coords.longitude;
	} else { // Arequipa
		point.latitude = -16.3989; 
		point.longitude = -71.535;
	}

	var resultsLimit = 10;
	var queryNumber = 0;
	var queryTimeLimitStep = 24*20;
	var countActions;

	if(req.params.i!=undefined) {
		queryNumber = parseInt(req.params.i);
	} else {
		req.session.queryTimeLimit = queryTimeLimitStep;
	}

	this.find({})
	.sort({createdAt: -1})
	.skip(resultsLimit * queryNumber)
	.limit(resultsLimit)
	.exec(function (err, action) {
		if (err) return handleError(err);
		if(action.length == 0) {
			callback(action);
		}
		countActions = action.length; //results.length;
		for(var i in action) {
			posts[i] = {}; //console.log('action.author.name: ' + query[0].author[0].name);
			posts[i].id = action[i]._id;
			//posts[i].fbId = '1400253030';
			getProviderId(action[i].authorId, i);
			posts[i].authorId = action[i].authorId;
			posts[i].event = action[i].name;
			posts[i].time = action[i].createdAt;
			posts[i].media = './uploads/' + action[i].media;
			posts[i].location = {};
			posts[i].location.latitude = action[i].geo[0];
			posts[i].location.longitude = action[i].geo[1];
			//getFBInfo(i, posts[i].fbId);
		}
	})
	function getProviderId(id, i) {
		User.findById(id, 'providerId hexCode', function (err, user) {
			posts[i].fbId = user.providerId;
			getFBInfo(i, posts[i].fbId, user.hexCode);
		});
	}
	function getFBInfo(i, fbUserId, hexCode) {
		FB.api('/'+fbUserId+'/', {access_token: req.session.passport.user.accessToken},  function(profile) {
			posts[i].author = {};
			//posts[i].author.idKey = idKey;
			posts[i].author.firstName = profile.first_name;
			posts[i].author.lastName = profile.last_name;
			posts[i].author.hexCode = hexCode;
			FB.api('/'+fbUserId+'/picture?redirect=0&height=200&type=normal&width=200',  function(picture) {
				posts[i].author.picture= picture.data.url;
				triggerNext();
			});
		});
	}
	function triggerNext() {
		countActions--;
		if(countActions===0) {
			var response = {posts: posts};
			callback(response);
		}
	}
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
          // handle the result
          console.log('Foto compartida en facebook exitósamente');
          callback();
        } else {
          error();
        }
      }
  );
}

module.exports = mongoose.model('Action', ActionSchema);