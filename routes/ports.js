var express = require('express');
var bodyParser = require('body-parser');
var portRouter = express.Router();
var Ports = require('../models/ports');
var verify = require('../verify');
var config = require('../config');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: config.mailService,
    auth: {
        user: config.nodeEmail,
        pass: config.nodeEmailPassword
    }
});

portRouter.use(bodyParser.json());

portRouter.route('/')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        Ports.find({}, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    })

    .post(function (req, res, next) {
        const decReq = JSON.parse(Buffer.from(req.body.payload, 'base64').toString());
        Ports.find({
            query: decReq.query
        }, function (err, resp) {
            if (err) throw err;
            if (resp.length) {
                if (decReq.userMessage && decReq.userMessage.message) {

                    var mailOptions = {
                        from: decReq.userMessage.email || 'anonymoususer@mail.com',
                        to: config.mailTo,
                        subject: decReq.userMessage.email + ' ' + decReq.userMessage.name + ' ' + decReq.userMessage.reason,
                        text: decReq.userMessage.message + ' -sent from ' + decReq.city
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });

                    if (resp[0].userMessage && resp[0].userMessage.length) {
                        decReq.userMessage = resp[0].userMessage.concat(decReq.userMessage);
                    } else {
                        decReq.userMessage = [decReq.userMessage];
                    }
                    Ports.findByIdAndUpdate(resp[0]._id, {
                        $set: decReq
                    }, {
                        new: true
                    }, function (err, resp) {
                        if (err) throw err;
                        res.end('port updated!');
                    });
                } else {
                    res.end('port already exists!');
                }
            } else {
                Ports.create(decReq, function (err, resp) {
                    if (err) throw err;
                    var id = resp._id;

                    res.writeHead(200, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Added the port!');
                });
            }
        });
    })

    .delete(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        Ports.remove({}, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    });

portRouter.route('/:respId')
    .get(verify.verifyOrdinaryUser, function (req, res, next) {
        Ports.findById(req.params.respId, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    })

    .put(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        Ports.findByIdAndUpdate(req.params.respId, {
            $set: req.body
        }, {
            new: true
        }, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    })

    .delete(verify.verifyOrdinaryUser, verify.verifyAdmin, function (req, res, next) {
        Ports.findByIdAndRemove(req.params.respId, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    });

module.exports = portRouter;