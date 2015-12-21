var mongoose = require('mongoose');

var noteSchema = mongoose.Schema({
  user: String,
  note: String,
  map: String,
  parcel: String
});

module.exports = mongoose.model('Note', noteSchema);
