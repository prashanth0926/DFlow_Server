/**
 * Created by molakala on 5/14/2017.
 */

var express = require('express');
var bodyParser = require('body-parser');
var blogRouter = express.Router();
var Blogs = require('../models/blogs');
var User = require('../models/users');
var verify = require('../verify');
var _ = require('lodash');

blogRouter.use(bodyParser.json());

blogRouter.route('/')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.find({published: true})
            .populate('reviews.postedBy')
            .populate('postedBy')
            .exec(function (err, out) {
                if (err)    throw err;
                res.json(out);
            });
    })
    .post(verify.verifyOrdinaryUser, function (req, res, next) {
        req.body.postedBy = req.decoded._id;
        Blogs.create(req.body, function (err, out) {
            if (err)    throw err;
            User.findById(req.decoded._id, function (err, user) {
                if (err)    throw err;
                user.pendingBlogs.push(out._id);
                user.save(function (err, output) {
                    if (err)    throw err;
                });
            });
            res.json(out);
        });
    })
    .delete(verify.verifyOrdinaryUser, verify.verifyAdmin, verify.verifySuperAdmin, function (req, res, next) {
        Blogs.remove(function (err, out) {
            if (err)    throw err;
            User.find({}).exec(function (err, users) {
                if (err)  throw err;
                _.forOwn(users, function (usr) {
                    usr.pendingBlogs = [];
                    usr.postedBlogs = [];
                });
                users.save(function (err, out) {
                    if (err)    throw err;
                });
            });
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Cleared all Blogs');
        });
    });

blogRouter.route('/pending')
    .get(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        Blogs.find({published: false})
            .populate('reviews.postedBy')
            .populate('postedBy')
            .exec(function (err, out) {
                if (err)    throw err;
                res.json(out);
            });
    });

blogRouter.route('/:Id/pending')
    .get(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        Blogs.findById(req.params.Id)
            .populate('reviews.postedBy')
            .populate('postedBy')
            .exec(function (err, out) {
                if (err)    throw err;
                if (out.published === false) {
                    res.json(out);
                } else {
                    var err = new Error('The Blog has been published!');
                    err.status = 403;
                    return next(err);
                }
            });
    })
    .put(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        Blogs.findById(req.params.Id)
            .exec(function (err, out) {
                if (err)    throw err;
                out.published = true;
                out.save(function (err, out) {
                    if (err)    throw err;
                    User.findById(out.postedBy._id)
                        .exec(function (err, usr) {
                            usr.pendingBlogs.remove(out._id);
                            usr.postedBlogs.push(out._id);
                            usr.save(function (err, rs) {
                                if (err)    throw err;
                            });
                        });
                    res.json(out);
                });
            });
    })
    .delete(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findByIdAndRemove(req.params.Id, function (err, out) {
            if (err)    throw err;
            User.findById(out.postedBy._id)
                .exec(function (err, usr) {
                    usr.pendingBlogs.remove(out._id);
                    usr.save(function (err, rs) {
                        if (err)    throw err;
                    });
                });
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Removed blog ' + out.title);
        });
    });

blogRouter.route('/:Id')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findById(req.params.Id)
            .populate('reviews.postedBy')
            .populate('postedBy')
            .exec(function (err, out) {
                if (err)    throw err;
                if (out.published === true && out.hidden !== true) {
                    res.json(out);
                } else {
                    var err = new Error('The Blog has not been published yet!');
                    err.status = 403;
                    return next(err);
                }
            });
    })
    .put(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        Blogs.findByIdAndUpdate(req.params.Id, {
            $set : req.body
        }, {
            new : true
        }, function (err, out) {
            if (err)    throw err;
            res.json(out);
        });
    })
    .delete(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findByIdAndRemove(req.params.Id, function (err, out) {
            if (err)    throw err;
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Removed blog ' + out.title);
        });
    });

blogRouter.route('/:Id/vote')
    .post(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findById(req.params.Id)
            .exec(function (err, out) {
                if (err)    throw err;
                var alreadyVoted = (out.upVotes.concat(out.downVotes)).some(function (l) {
                    return l.equals(req.decoded._id);
                });
                if (alreadyVoted) {
                    res.json(out);
                } else {
                    if (req.query.upVote === true) {
                        out.upVotes.push(req.decoded._id);
                        out.voteCounter++;
                    } else {
                        out.downVotes.push(req.decoded._id);
                        out.voteCounter--;
                    }
                    out.save(function (err, out) {
                        if (err)    throw err;
                        res.json(out);
                    });
                }
            });
    });

blogRouter.route('/:Id/reviews')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findById(req.params.Id)
            .populate('reviews.postedBy')
            .populate('postedBy')
            .exec(function (err, out) {
                if (err)    throw err;
                if (out.published === true) {
                    res.json(out);
                } else {
                    res.writeHead(403, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('This blog has not been published yet!');
                }
            });
    })
    .post(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findById(req.params.Id, function (err, out) {
            if (err)    throw err;
            req.body.postedBy = req.decoded._id;
            out.reviews.push(req.body);
            out.save(function (err, out) {
                if (err)    throw err;
                Blogs.findById(out._id)
                    .populate('reviews.postedBy')
                    .exec(function (err, out) {
                        if (err)    throw err;
                        res.json(out);
                    });
            });
        });
    })
    .delete(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        Blogs.findById(req.params.Id, function (err, out) {
            if (err)    throw err;
            out.reviews = [];
            out.save(function (err, out) {
                if (err)    throw err;
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end('Removed all reviews for '+out.title);
            });
        });
    });

blogRouter.route('/:Id/reviews/:reviewId')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findById(req.params.Id)
            .populate('reviews.postedBy')
            .exec(function (err, out) {
                if (err)    throw err;
                res.json(out.reviews.id(req.params.reviewId));
            });
    })
    .put(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findById(req.params.Id, function (err, out) {
            if (err)    throw err;
            if (out.reviews.id(req.params.reviewId).postedBy
                != req.decoded._id) {
                var err = new Error('You are not authorized to perform this operation!');
                err.status = 403;
                return next(err);
            }
            out.reviews.id(req.params.reviewId).remove();
            req.body.postedBy = req.decoded._id;
            out.reviews.push(req.body);
            out.save(function (err, out) {
                if (err)    throw err;
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end('Updated review');
            });
        });
    })
    .delete(verify.verifyOrdinaryUser, function (req, res, next) {
        Blogs.findById(req.params.Id, function (err, out) {
            if (err)    throw err;
            if (out.reviews.id(req.params.reviewId).postedBy
                != req.decoded._id) {
                var err = new Error('You are not authorized to perform this operation!');
                err.status = 403;
                return next(err);
            }
            out.reviews.id(req.params.reviewId).remove();
            out.save(function (err, out) {
                if (err)    throw err;
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end('Deleted review');
            });
        });
    });

module.exports = blogRouter;