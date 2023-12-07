const mongoose = require('mongoose');
const adminsSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const Admin = mongoose.model('Admin', adminsSchema);
module.exports = Admin;