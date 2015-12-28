var mongoose = require('mongoose');

var mapSchema = mongoose.Schema({
  datafiles: [String],
  name: String,
  userid: String,
  tilelayers: [String]
});

module.exports = mongoose.model('Map', mapSchema);
