var jwt = require('jsonwebtoken');
var config = require('./config');

exports.createToken = function(user) {  
  var token = jwt.sign({
    id: user.id,
  }, config.tokenSecret, {
    expiresIn : 60*60*24
  });
  return token;
}