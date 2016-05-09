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
	if(req.session.coords != undefined) {
		point.latitude = req.session.coords.latitude;
		point.longitude = req.session.coords.longitude;
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