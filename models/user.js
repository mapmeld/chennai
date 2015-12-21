var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  name: String,
  google_id: String,
  language: String,
  maps: [String],
  notes: Object
});

module.exports = mongoose.model('User', userSchema);
