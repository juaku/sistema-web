var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  name: String,
  provider: String,
  providerId: {type: String, unique: true},
  photo: String,
  createdAt: {type: Date, default: Date.now},
  blockedUsers : [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

var ActionSchema = new Schema({
  name: String,
  location: String,
  photo: String,
  createdAt: {type: Date, default: Date.now},
  author : [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

var TagSchema = new Schema({
  name: String,
  eventName : String,
  createdAt: {type: Date, default: Date.now},
  actions : [{ type: Schema.Types.ObjectId, ref: 'Action' }]
});


UserSchema.methods.signUp = function signUp () {
		
}

var User = mongoose.model('User', UserSchema);
var Action = mongoose.model('Action', ActionSchema);
var Tag = mongoose.model('Tag', TagSchema);