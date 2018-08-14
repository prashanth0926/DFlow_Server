var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userMessageSchema = new Schema({
    email: String,
    name: String,
    reason: String,
    message: String
}, {
    timestamps: true
});

var portSchema = new Schema({
    userMessage: [userMessageSchema]
}, {
    strict: false,
    timestamps: true
});

var Ports = mongoose.model('Port', portSchema);

module.exports = Ports;