/**
 * Created by Prashanth Molakala on 7/18/2016.
 */

module.exports = {
    'secretKey': process.env.SECRET_KEY || '12345-67890-09876-54321',
    'mongoUrl': process.env.MONGO_URL || 'mongodb://localhost:27017/upflow',
    'nodeEmail': process.env.NODE_EMAIL,
    'nodeEmailPassword': process.env.NODE_EMAIL_PASSWORD,
    'toMail': process.env.TO_EMAIL,
    'mailService': process.env.MAIL_SERVICE
};

