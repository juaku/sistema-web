var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  name: String,
  provider: String,
  providerId: {type: String, unique: true},
  photo: String,
  createdAt: {type: Date, default: Date.now}
});

UserSchema.methods.signUp = function signUp () {
		
}

var User = mongoose.model('User', UserSchema);
