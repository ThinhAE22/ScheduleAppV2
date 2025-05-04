const mongoose = require('mongoose')
const Schedule = require('./schedule') // Adjust path if needed

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // ensures the uniqueness of username
  },
  email: {
    type: String,
    required: true,
    unique: true, // ensures email is not duplicated
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Invalid email address']
  },
  name: String,
  passwordHash: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  schedules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule'
    }
  ]
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash // hide password hash
  }
})

// Middleware to delete schedules after user is deleted
userSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Schedule.deleteMany({ user: doc._id });
    console.log(`Deleted all schedules for user ${doc._id}`);
  }
});

const User = mongoose.model('User', userSchema)

module.exports = User
