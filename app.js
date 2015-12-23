var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var compression = require("compression");
var mongoose = require("mongoose");
var passport = require("passport");
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var User = require('./models/user.js');
var Note = require('./models/note.js');
var Map = require('./models/map.js');
var multer = require('multer');
var s3 = require('multer-s3');

mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI || 'localhost');

var upload = multer({
  storage: s3({
    dirname: 'maps',
    bucket: 'chennai-test',
    secretAccessKey: process.env.AWS_SECRET_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: 'ap-southeast-1',
    filename: function (req, file, cb) {
      cb(null, Date.now());
    }
  })
});

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
  Map.find({}, function (err, maps) {
    if (err) {
      throw err;
    }
    res.render('index', {
      user: req.user || null,
      maps: maps
    });
  });
});

app.get('/upload', function (req, res) {
  res.render('uploader', {
    user: req.user || null
  });
});

app.post('/upload', upload.single('upload'), function (req, res) {
  var m = new Map();
  m.name = req.body.name || 'Unnamed Map';
  m.datafiles = [
    "https://s3-ap-southeast-1.amazonaws.com/chennai-test/" + req.file.key
  ];
  m.save(function (err) {
    if (err) {
      throw err;
    }
    res.redirect('/view/' + m._id);
  });
});

app.get('/view/:mapid', function (req, res) {
  Map.findById(req.params.mapid, function (err, mp) {
    var myUser;
    if (req.user) {
      myUser = req.user;
    } else {
      myUser = { id: 'test' };
    }
    Note.find({ map: 'first', user: myUser.id }, function (err, notes) {
      if (err) {
        throw err;
      }
      res.render('openmap', {
        user: myUser,
        notes: notes,
        map: mp
      });
    });
  });
});

app.get('/plainmap', function (req, res) {
  var myUser;
  if (req.user) {
    myUser = req.user;
  } else {
    myUser = { id: 'test' };
  }
  Note.find({ map: 'first', user: myUser.id }, function (err, notes) {
    if (err) {
      throw err;
    }
    res.render('map', {
      user: myUser,
      notes: notes
    });
  });
});

app.get('/mapper', function (req, res) {
  if (!req.user) {
    return res.redirect('/plainmap');
  }
  Note.find({ map: 'first', user: req.user.id }, function (err, notes) {
    if (err) {
      throw err;
    }
    res.render('map', {
      user: req.user || null,
      notes: notes
    });
  });
});

app.post('/savenote', function (req, res) {
  Note.findOne({ map: req.body.layer, user: req.body.user, parcel: req.body.id }, function (err, n) {
    if (err) {
      return res.json(err);
    }
    if (!n) {
      n = new Note();
      n.user = req.body.user;
      n.map = req.body.layer;
      n.parcel = req.body.id;
    }
    n.note = req.body.note;
    n.save(function (err) {
      res.json(err || n._id);
    });
  });
});

app.post('/deletenote', function (req, res) {
  Note.findOne({ map: req.body.layer, user: req.body.user, parcel: req.body.id }, function (err, n) {
    if (n) {
      n.remove(function (err) {
        res.json(err || 'deleted');
      });
    } else {
      res.json({});
    }
  });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email'] }));

app.get('/map',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/mapper');
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CONSUMER_KEY,
    clientSecret: process.env.GOOGLE_CONSUMER_SECRET,
    callbackURL: "http://chennai-data-portal.herokuapp.com/map",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOne({ id: profile.id }, function (err, user) {
      if (!user) {
        user = new User();
        user.id = profile.id;
        user.name = 'Test';
        user.language = 'en';
        user.maps = [];
        user.notes = {};
        user.save(function (err) {
          done(err, user);
        });
      }
      return done(err, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({ id: id }, function(err, user) {
    done(err, user);
  });
});

var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log('Serving on port ' + port);
});

module.exports = app;
