/**
 * Created by Prashanth Molakala on 7/18/2016.
 */

var mongoose = require('mongoose');
var schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var user = new schema({
    username : String,
    password : String,
    fullName: String,
    imageUrl: {
        type: String,
        default: 'https://www.mautic.org/media/images/default_avatar.png'
    },
    admin : {
        type : Boolean,
        default : false
    },
    superAdmin : {
        type : Boolean,
        default : false
    },
    pendingBlogs : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Blog'
        }
    ],
    postedBlogs : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Blog'
        }
    ],
    topicsFollowing : [String],
    details : {}
}, {
    timestamps : true
});

user.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', user);