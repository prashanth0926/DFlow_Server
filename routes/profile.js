var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var Models = require('../models/profile');
var verify = require('../verify');

router.use(bodyParser.json());

router.route('/')
.get(function(req,res,next){
    Models.find({}, function(err, resp){
        if(err) throw err;
        res.json({ content: Buffer.from(JSON.stringify(resp[0])).toString('base64') });
    });
})

.post(verify.verifyOrdinaryUser, verify.verifyAdmin, function(req, res, next){
    Models.create(req.body, function(err, resp){
        if(err) throw err;
        console.log('Model added!');
        var id = resp._id;
        
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        res.end('Added the Model with id: ' + id);
    });
})

.delete(verify.verifyOrdinaryUser, verify.verifyAdmin, function(req, res, next){
    Models.remove({}, function(err, resp){
        if(err) throw err;
        res.json(resp);
    });
});

module.exports = router;