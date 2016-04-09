var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  providerId: {type: String, unique: true},
  provider: String,
  name: String,
  familyName: String,
  userName: String,
  hexCode: String,
  favUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {type: Date, default: Date.now}
});

var ActionSchema = new Schema({
  name: String,
  location: String,
  geo: { type: [Number], index: '2d'},
  media: String,
  active: Boolean,
  author : [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {type: Date, default: Date.now}
});

var TagSchema = new Schema({
  name: String,
  originalName : String,
  actions : [{ type: Schema.Types.ObjectId, ref: 'Action' }],
  createdAt: {type: Date, default: Date.now}
});

UserSchema.methods.signUp = function signUp () {

}

var User = mongoose.model('User', UserSchema);
var Action = mongoose.model('Action', ActionSchema);
var Tag = mongoose.model('Tag', TagSchema);