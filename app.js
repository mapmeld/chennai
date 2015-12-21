var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var compression = require("compression");
var mongoose = require("mongoose");
var passport = require("passport");
var GoogleStrategy = require('passport-google').Strategy;

mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI || 'localhost');

var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express['static'](__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.use(session({ secret: process.env.GOOGLE_SESSION || 'fj23f90jfoijfl2mfp293i019eoijdoiqwj129' }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/map', function (req, res) {
  res.render('map');
});

app.get('/login', passport.authenticate('google'));
app.get('/loginmap',
  passport.authenticate('google', { successRedirect: '/map',
                                    failureRedirect: '/login' }));

passport.use(new GoogleStrategy({
    returnURL: 'http://www.cag.org.in/loginmap',
    realm: 'http://www.cag.org.in/'
  },
  function(identifier, profile, done) {
    User.findOrCreate({ openId: identifier }, function(err, user) {
      done(err, user);
    });
  }
));

var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log('Serving on port ' + port);
});

module.exports = app;