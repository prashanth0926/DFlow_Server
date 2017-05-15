/**
 * Created by molakala on 5/14/2017.
 */

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var reviewSchema = new schema({
    review : {
        type : String,
        required : true
    },
    rating: {
        type: Number,
        default: 5
    },
    postedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    slackUserName: String,
    details : {}
}, {
    timestamps : true
});

var blogSchema = new schema({
    title: String,
    blog : {
        type : String,
        required : true
    },
    reviews : [reviewSchema],
    topics : [String],
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    averageRating: {
        type: Number,
        default: 5
    },
    slackUserName: String,
    voteCounter: {
        type: Number,
        default: 0
    },
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
    published: {
        type: Boolean,
        default: false
    },
    details: {}
}, {
    timestamps: true
});

var Blogs = mongoose.model('Blog', blogSchema);

module.exports = Blogs;