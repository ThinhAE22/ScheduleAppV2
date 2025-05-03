const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')

const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const schedulesRouter = require('./controllers/schedules')
const machinesRouter = require('./controllers/machines')


const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

// Schedule the task to run every Monday at 00:00 (midnight)
const cron = require('node-cron')
const moment = require('moment-timezone');
const Schedule = require('./models/schedule')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URL)

mongoose.connect(config.MONGODB_URL)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/schedules', schedulesRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/machines',machinesRouter)


if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing')
  app.use('/api/testing', testingRouter)
}

app.use('/api/schedules', middleware.userExtractor, schedulesRouter);
app.use('/api/users', middleware.userExtractor, middleware.requireAdmin, usersRouter);
app.use('/api/login', middleware.userExtractor, loginRouter);
app.use('/api/machines', middleware.userExtractor, middleware.requireAdmin, machinesRouter);

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

// Set up cron job
cron.schedule(
  '0 0 * * 1',
  async () => {
    try {
      await Schedule.deleteMany({});
      console.log('✅ All schedules deleted automatically (cron job)');
    } catch (error) {
      console.error('❌ Error during automatic schedule reset:', error.message);
    }
  },
  {
    timezone: 'Europe/Helsinki'
  }
);

module.exports = app