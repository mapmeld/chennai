var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  name: String,
  language: String,
  maps: [String],
  notes: Object
});

module.exports = mongoose.model('User', userSchema);
