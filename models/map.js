var mongoose = require('mongoose');

var mapSchema = mongoose.Schema({
  datafiles: [String],
  name: String
});

module.exports = mongoose.model('Map', mapSchema);
