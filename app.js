const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const compression = require("compression");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('./models/user.js');
const Note = require('./models/note.js');
const Map = require('./models/map.js');
const multer = require('multer');
//var ms3 = require('multer-s3');

var AWS = require('aws-sdk');
AWS.config.secretAccessKey = process.env.AWS_SECRET_KEY;
AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY;
var S3_BUCKET = 'chennai-test';
var s3 = new AWS.S3();

mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI || 'localhost');

var upload = multer({
  storage: ms3({
    dirname: 'maps',
    bucket: S3_BUCKET,
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
app.set('view engine', 'pug');
app.use(express['static'](__dirname + '/static'));
app.use(bodyParser({ limit: '50mb' }));
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.use(session({ secret: process.env.GOOGLE_SESSION || 'fj23f90jfoijfl2mfp293i019eoijdoiqwj129' }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (req, res) {
  Map.find({}).limit(8).exec(function (err, maps) {
    if (err) {
      throw err;
    }
    res.render('index', {
      user: req.user || null,
      maps: maps
    });
  });
});

app.get('/tile', function (req, res) {
  res.render('tiler', {
    map: null,
    user: req.user || null
  });
});

app.get('/admin', function (req, res) {
  Map.find({}, function (err, maps) {
    res.render('admin', {
      user: req.user || null
    });
  });
});

app.get('/profile', function (req, res) {
  Map.find({ userid: (req.user || {id: 0}).id }, function (err, maps) {
    if (err) {
      return res.json(err);
    }
    res.render('profile', {
      user: req.user || null,
      maps: maps
    });
  });
});

app.get('/uploader', function (req, res) {
  res.render('uploader', {
    user: req.user || null
  });
});

app.post('/uploadfile', upload.single('upload'), function (req, res) {
  var m = new Map();
  m.name = req.body.name || 'Unnamed Map';
  m.userid = (req.user || {id: 0}).id;
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

app.post('/uploadgeo', function (req, res) {
  var tstamp = '' + Date.now();
  var params = { Bucket: S3_BUCKET, Key: tstamp, Body: req.body.geojson };
  s3.putObject(params, function(err, data) {
    if (err) {
      res.json(err);
    } else {
      var m = new Map();
      m.name = req.body.name || 'Unnamed Map';
      m.userid = (req.user || {id: 0}).id;
      m.datafiles = [
        "https://s3-ap-southeast-1.amazonaws.com/chennai-test/" + tstamp
      ];
      m.save(function (err) {
        if (err) {
          throw err;
        }
        res.redirect('/view/' + m._id);
      });
    }
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

app.get('/layers', function (req, res) {
  var myUser = { id: 'test' };
  Map.find({}).limit(8).exec(function (err, maps) {
    if (err) {
      throw err;
    }
    res.render('layermap', {
      user: myUser,
      notes: [],
      maps: maps
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

app.get('/upload',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/uploader');
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CONSUMER_KEY,
    clientSecret: process.env.GOOGLE_CONSUMER_SECRET,
    callbackURL: "http://chennai-data-portal.herokuapp.com/upload",
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
