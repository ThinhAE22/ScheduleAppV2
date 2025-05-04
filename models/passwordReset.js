const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PasswordResetSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  resetString: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

const PasswordReset = mongoose.model('PasswordReset', PasswordResetSchema);

module.exports = PasswordReset;
