const mongoose = require('mongoose')

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hours = Array.from({ length: 15 }, (_, i) => `${8 + i}:00`);
const washingMachines = ['Washing 1', 'Washing 2', 'Washing 3', 'Washing 4', 'Washing 5'];
const dryerMachines = ['Dryer 1', 'Dryer 2', 'Dryer 3', 'Dryer 4', 'Dryer 5'];

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: days,
  },
  time: {
    type: String,
    required: true,
    enum: hours,
  },
  washingMachine: {
    type: String,
    enum: washingMachines,
    default: null,
  },
  dryerMachine: {
    type: String,
    enum: dryerMachines,
    default: null,
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

scheduleSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Schedule',scheduleSchema)