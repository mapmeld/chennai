var mongoose = require('mongoose');

var mapSchema = mongoose.Schema({
  datafiles: [String]
});

module.exports = mongoose.model('Map', mapSchema);
