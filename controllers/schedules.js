const schedulesRouter = require('express').Router();
const { now } = require('lodash');
const Schedule = require('../models/schedule');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

// Helper function to extract token from Authorization header
const getTokenFrom = request => {
    const authorization = request.get('authorization');
    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.replace('Bearer ', '');
    }
    return null;
};

// Middleware to extract user from token
const userExtractor = async (request, response, next) => {
    const token = getTokenFrom(request);
    if (!token) {
        return response.status(401).json({ error: 'Token missing or invalid' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.SECRET);
        if (!decodedToken.id) {
            return response.status(401).json({ error: 'Token invalid' });
        }

        const user = await User.findById(decodedToken.id);
        if (!user) {
            return response.status(404).json({ error: 'User not found' });
        }

        request.user = user;
        next();
    } catch (error) {
        return response.status(401).json({ error: 'Token invalid' });
    }
};

schedulesRouter.get('/', async (request, response) => {
    try {
        const schedules = await Schedule.find({}).populate('user', { username: 1, name: 1 });
        response.json(schedules);
    } catch (error) {
        response.status(500).json({ error: 'Failed to fetch schedules' });
    }
});


// POST new blog
// add , userExtractor later
schedulesRouter.post('/',userExtractor, async (request, response) => {
    const { date, timeStart, timeEnd, printer3DMachine } = request.body;
    const user = request.user;

    // Check for missing fields
    if (!date || !timeStart || !timeEnd || !printer3DMachine) {
        return response.status(400).json({ error: 'All fields (date, timeStart, timeEnd, printer3DMachine) are required' });
    }

    try {
        // Convert date to a Date object for accurate comparison
        const scheduleDate = new Date(date);
        
        // Ensure the date is not in the past
        if (scheduleDate < new Date().setHours(0, 0, 0, 0)) {
            return response.status(400).json({ error: 'Date cannot be in the past' });
        }

        // Check for overlapping schedules
        const overlappingConditions = [
            { date: scheduleDate, printer3DMachine },
            {
                $or: [
                    { timeStart: { $lt: timeEnd }, timeEnd: { $gt: timeStart } },
                    { timeStart: { $gte: timeStart, $lt: timeEnd } },
                    { timeEnd: { $gt: timeStart, $lte: timeEnd } },
                ],
            }
        ];

        const conflict = await Schedule.findOne({ $and: overlappingConditions });

        if (conflict) {
            return response.status(400).json({ error: 'This time slot is already booked for the selected machine.' });
        }

        // Create and save the schedule
        const schedule = new Schedule({
            date: scheduleDate,
            timeStart,
            timeEnd,
            printer3DMachine,
            user: user._id,
        });

        const savedSchedule = await schedule.save();
        user.schedules = user.schedules.concat(savedSchedule._id);
        await user.save();

        response.status(201).json(savedSchedule);
    } catch (error) {
        response.status(500).json({ error: 'Failed to save schedule', details: error.message });
    }
});



//Delete all schedules Debug only

schedulesRouter.delete('/all', async (request, response) => {

    try {
        await Schedule.deleteMany({}); // Delete all schedules
        response.status(200).json({ message: 'All schedules deleted successfully' });
    } catch (error) {
        console.error('Error during bulk deletion:', error.message);
        response.status(500).json({ error: 'Internal server error', details: error.message });
    }
});


// DELETE schedules id based
schedulesRouter.delete('/:id', userExtractor, async (request, response) => {
    const { id } = request.params;
    const user = request.user; // Extracted from the token by userExtractor

    const getScheduleMoment = (schedule) => {
    const date = schedule.date; // This is already a Date object
    const startTime = schedule.timeStart; // e.g., "07:30"
    const [startHour, startMinute] = startTime.split(':').map(Number);

    // Use the date directly and set the correct start time
    const startMoment = moment.tz(date, 'Europe/Helsinki')
        .hour(startHour)
        .minute(startMinute)
        .second(0);

    return startMoment;
}

    try {
        const schedule = await Schedule.findById(id).populate('user');
        if (!schedule) {
            return response.status(404).json({ error: 'Schedule not found' });
        }

        if (schedule.user._id.toString() !== user._id.toString()) {
            return response.status(403).json({ error: 'Permission denied' });
        }

        const now = moment.tz('Europe/Helsinki');
        const startMoment = getScheduleMoment(schedule);
        console.log("Current time (now):", now.format());
        console.log("Scheduled start time (startMoment):", startMoment.format());

        // Calculate the time difference in minutes
        const diffInMinutes = startMoment.diff(now, 'minutes');
        console.log("Time difference in minutes:", diffInMinutes);

        
        // Check if the schedule can be deleted
        if (diffInMinutes <= 30) {
            return response.status(403).json({ error: 'Cannot delete a schedule less than 30 minutes before it starts' });
        }

        await Schedule.deleteOne({ _id: id });
        response.status(204).end();

    } catch (error) {
        console.error('Error during deletion:', error.message);
        response.status(500).json({ error: 'Internal server error', details: error.message });
    }
});



module.exports = schedulesRouter;