var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/users');
var verify = require('../verify');
var _ = require('lodash');

/* GET users listing. */
router.get('/', verify.verifyOrdinaryUser, verify.verifyAdmin, function(req, res, next) {
  User.find({}, function (err, out) {
    if (err)  throw err;
    res.json(out);
  });
});

router.put('/:Id', verify.verifyOrdinaryUser, verify.verifyAdmin, verify.verifySuperAdmin, function(req, res, next) {
    User.findByIdAndUpdate(req.params.Id, {
        $set : req.body
    }, {
        new : true
    }, function (err, out) {
        if (err)    throw err;
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        res.end('Updated user: '+ out.username);
    });
});

router.get('/count', verify.verifyOrdinaryUser, function(req, res, next) {
  User.find({}, function (err, out) {
    if (err)  throw err;
    res.json({count: out.length});
  });
});

router.get('/hasRegistered/:username', function(req, res, next) {
  User.find({username: req.params.username}, function (err, out) {
    if (err)  throw err;
    res.json({hasRegistered: !_.isEmpty(out)});
  });
});

router.get('/incAnswer', verify.verifyOrdinaryUser, function(req, res, next) {
  User.findById(req.decoded._id, function (err, out) {
    if (err)  throw err;
    out.answerCount = out.answerCount+1;
    out.save(function (err, out) {
      if (err)  throw err;
      res.json(out);
    })
  });
});

router.get('/current', verify.verifyOrdinaryUser, function(req, res, next) {
  User.findById(req.decoded._id)
      .populate({path: 'askedQuestions'})
      .exec(function (err, out) {
        if (err) throw err;
        res.json(out);
      });
});

router.post('/register', function (req, res, next) {
  User.register(new User({ username : req.body.username}),
      req.body.password, function (err, out) {
        if (err)  return res.status(500).json({err: err});
        out.fullName = req.body.fullName;
        out.imageUrl = req.body.imageUrl;
        out.save(function (err, out) {
          if (err)  return res.status(500).json({err: err});
          passport.authenticate('local')(req, res, function () {
            return res.status(200).json({status: 'Registration Successful!'});
          });
        });
      }
  );
});

router.post('/login', function (req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }
      var token = verify.getToken({"username":user.username, "_id":user._id, "admin": user.admin, "superAdmin": user.superAdmin});
      res.status(200).json({
        status: 'Login successful!',
        success: true,
        token: token,
        uid: user._id,
        admin: user.admin,
        superAdmin: user.superAdmin
      });
    });
  })(req,res,next);
});

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});

module.exports = router;
