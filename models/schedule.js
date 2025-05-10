const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value >= new Date().setHours(0, 0, 0, 0); // Ensure date is not in the past
      },
      message: 'The date cannot be in the past.',
    },
  },
  timeStart: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/, // 00:00 to 23:59
  },
  timeEnd: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/, // 00:00 to 23:59
  },
  printer3DMachine: {
    type: String,
    match: /^Printer3D\s\d+$/,
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Clean up the JSON response
scheduleSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
