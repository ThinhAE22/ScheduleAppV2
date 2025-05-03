const mongoose = require('mongoose');
const config = require('./utils/config');
const logger = require('./utils/logger');
const Schedule = require('./models/schedule');
const cron = require('node-cron');

mongoose.set('strictQuery', false);

logger.info('connecting to', config.MONGODB_URL);

mongoose.connect(config.MONGODB_URL)
  .then(() => logger.info('connected to MongoDB'))
  .catch((error) => logger.error('error connecting to MongoDB:', error.message));

// Cron job to delete all schedules every Monday at 00:00
cron.schedule('0 0 * * 1', async () => {
  try {
    await Schedule.deleteMany({});
    console.log('✅ [Cron] All schedules deleted automatically');
  } catch (error) {
    console.error('❌ [Cron] Error during automatic schedule reset:', error.message);
  }
});

// Keep the worker running
console.log('⏳ Cron worker started...');
