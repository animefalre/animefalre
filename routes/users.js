const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
mongoose.connect(process.env.MONGO_URI);


// models/User.js
const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  userPic: {
    type: String
  },
  allowNotification: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.plugin(passportLocalMongoose);

// Create User model
const User = mongoose.model('User', userSchema);

module.exports = User;
