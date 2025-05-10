const mongoose = require('mongoose');

const availableMachineSchema = new mongoose.Schema({
  printer3DMachine: {
    type: String,
    required: [true, 'printer3DMachine is required'],
    match: [/^Printer3D\s\d+$/, 'Must start with "Printer3D" followed by a number'],
  },
});

availableMachineSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('AvailableMachine', availableMachineSchema);
