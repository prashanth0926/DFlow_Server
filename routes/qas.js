/**
 * Created by pmolakala on 5/9/17.
 */

var express = require('express');
var bodyParser = require('body-parser');
var qaRouter = express.Router();
var QAs = require('../models/qas');
var User = require('../models/users');
var verify = require('../verify');
var _ = require('lodash');

qaRouter.use(bodyParser.json());

qaRouter.route('/')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.find({})
            .populate('answers.userId')
            .populate('userId')
            .exec(function (err, out) {
                if (err)    throw err;
                res.json(out);
            });
    })
    .post(verify.verifyOrdinaryUser, function (req, res, next) {
        req.body.userId = req.decoded._id;
        QAs.create(req.body, function (err, out) {
            if (err)    throw err;
            User.findById(req.decoded._id, function (err, user) {
                if (err)    throw err;
                user.askedQuestions.push(out._id);
                user.save(function (err, output) {
                    if (err)    throw err;
                });
            });
            res.json(out);
        });
    })
    .delete(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        QAs.remove(function (err, out) {
            if (err)    throw err;
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Cleared all QAs');
        });
    });

qaRouter.route('/:Id')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findById(req.params.Id)
            .populate('answers.userId')
            .populate('userId')
            .exec(function (err, out) {
                if (err)    throw err;
                res.json(out);
            });
    })
    .put(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findByIdAndUpdate(req.params.Id, {
            $set : req.body
        }, {
            new : true
        }, function (err, out) {
            if (err)    throw err;
            res.json(out);
        });
    })
    .delete(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        QAs.findByIdAndRemove(req.params.Id, function (err, out) {
            if (err)    throw err;
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Removed QA ' + out.title);
        });
    });

qaRouter.route('/:Id/vote')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findById(req.params.Id)
            .exec(function (err, out) {
                if (err)    throw err;
                var alreadyVoted = (out.upVotes.concat(out.downVotes)).some(function (l) {
                    return l.equals(req.decoded._id);
                });
                if (alreadyVoted) {
                    res.json({voteCount: (out.upVotes.length - out.downVotes.length)});
                } else {
                    if (req.query.upVote === true) {
                        out.upVotes.push(req.decoded._id);
                    } else {
                        out.downVotes.push(req.decoded._id);
                    }
                    out.save(function (err, out) {
                        if (err)    throw err;
                        res.json({voteCount: (out.upVotes.length - out.downVotes.length)});
                    });
                }
            });
    });

qaRouter.route('/:Id/answers')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findById(req.params.Id)
            .populate('answers.userId')
            .populate('userId')
            .exec(function (err, out) {
                if (err)    throw err;
                res.json(out);
            });
    })
    .post(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findById(req.params.Id, function (err, out) {
            if (err)    throw err;
            req.body.userId = req.decoded._id;
            out.answers.push(req.body);
            out.save(function (err, out) {
                if (err)    throw err;
                QAs.findById(out._id)
                    .populate('answers.userId')
                    .exec(function (err, out) {
                        if (err)    throw err;
                        res.json(out);
                    });
            });
        });
    })
    .delete(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        QAs.findById(req.params.Id, function (err, out) {
            if (err)    throw err;
            out.answers = [];
            out.save(function (err, out) {
                if (err)    throw err;
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end('Removed all answers for '+out.title);
            });
        });
    });

qaRouter.route('/:Id/answers/:answerId')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findById(req.params.Id)
            .populate('answers.userId')
            .exec(function (err, out) {
                if (err)    throw err;
                res.json(out.answers.id(req.params.answerId));
            });
    })
    .put(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findById(req.params.Id, function (err, out) {
            if (err)    throw err;
            if (out.answers.id(req.params.answerId).userId
                != req.decoded._id) {
                var err = new Error('You are not authorized to perform this operation!');
                err.status = 403;
                return next(err);
            }
            out.answers.id(req.params.answerId).remove();
            req.body.userId = req.decoded._id;
            out.answers.push(req.body);
            out.save(function (err, out) {
                if (err)    throw err;
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end('Updated answer');
            });
        });
    })
    .delete(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findById(req.params.Id, function (err, out) {
            if (err)    throw err;
            if (out.answers.id(req.params.answerId).userId
                != req.decoded._id) {
                var err = new Error('You are not authorized to perform this operation!');
                err.status = 403;
                return next(err);
            }
            out.answers.id(req.params.answerId).remove();
            out.save(function (err, out) {
                if (err)    throw err;
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end('Deleted answer');
            });
        });
    });

qaRouter.route('/:Id/answers/:answerId/vote')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        QAs.findById(req.params.Id)
            .exec(function (err, out) {
                if (err)    throw err;
                var answer = out.answers.id(req.params.answerId);
                var count = answer.upVotes.length - answer.downVotes.length;
                var alreadyVoted = (answer.upVotes.concat(answer.downVotes)).some(function (l) {
                    return l.equals(req.decoded._id);
                });
                if (alreadyVoted) {
                    res.json({voteCount: count});
                } else {
                    if (req.query.upVote === true) {
                        answer.upVotes.push(req.decoded._id);
                        count++;
                    } else {
                        answer.downVotes.push(req.decoded._id);
                        count--;
                    }
                    out.answers.id(req.params.answerId).remove();
                    out.answers.push(answer);
                    out.save(function (err, out) {
                        if (err)    throw err;
                        res.json({voteCount: count});
                    });
                }
            });
    });

module.exports = qaRouter;