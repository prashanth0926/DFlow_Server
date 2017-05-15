/**
 * Created by pmolakala on 5/9/17.
 */

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var answerSchema = new schema({
    answer : {
        type : String,
        required : true
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    slackUserName: String,
    upVotes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true
        }
    ],
    downVotes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true
        }
    ],
    details : {}
}, {
    timestamps : true
});

var qaSchema = new schema({
    title: String,
    question : {
        type : String,
        required : true
    },
    answers : [answerSchema],
    topics : [String],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    slackUserName: String,
    upVotes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true
        }
    ],
    downVotes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true
        }
    ],
    details: {}
}, {
    timestamps: true
});

var QAs = mongoose.model('QA', qaSchema);

module.exports = QAs;