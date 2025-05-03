const mongoose = require('mongoose')

const availableMachineSchema = new mongoose.Schema({
  washingMachine: {
    type: String,
    default: null,
    match: /^Washing\s\d+$/, // must start with "Washing" and a number
  },
  dryerMachine: {
    type: String,
    default: null,
    match: /^Dryer\s\d+$/,   // must start with "Dryer" and a number
  },
})

availableMachineSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('AvailableMachine', availableMachineSchema)
