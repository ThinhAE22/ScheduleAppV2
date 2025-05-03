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
schedulesRouter.post('/', userExtractor, async (request, response) => {
    const { day, time, washingMachine, dryerMachine } = request.body;
    const user = request.user;

    if (!day || !time || (!washingMachine && !dryerMachine)) {
        return response.status(400).json({ error: 'Day, time, and at least one machine (Dryer or Washing) are required' });
    }

    try {
        // Check if the user already has any schedule (i.e., one per week)
        const hasExistingBooking = await Schedule.findOne({ user: user._id });

        if (hasExistingBooking) {
            return response.status(400).json({ error: 'You already have a booking for this week' });
        }

        const schedule = new Schedule({
            day,
            time,
            washingMachine,
            dryerMachine,
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

/*
schedulesRouter.delete('/all', async (request, response) => {

    try {
        await Schedule.deleteMany({}); // Delete all schedules
        response.status(200).json({ message: 'All schedules deleted successfully' });
    } catch (error) {
        console.error('Error during bulk deletion:', error.message);
        response.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
*/ 

// DELETE schedules id based
schedulesRouter.delete('/:id', userExtractor, async (request, response) => {
    const { id } = request.params;
    const user = request.user; // Extracted from the token by userExtractor

    // Function to combine schedule day and time
    // Function to return a moment object for the schedule's day and time
    function getScheduleMoment(schedule) {
        const day = schedule.day; // e.g. "Monday"
        const time = schedule.time; // e.g. "11:00"
        const [hour, minute] = time.split(':').map(Number);

        // Create a moment object for the current week's scheduled time
        return moment.tz('Europe/Helsinki').day(day).hour(hour).minute(minute).second(0);

    }

    try {
        const schedule = await Schedule.findById(id).populate('user'); // Populate the user field

        if (!schedule) {
            return response.status(404).json({ error: 'Schedule not found' });
        }

        // Check if the schedule belongs to the authenticated user
        if (schedule.user._id.toString() !== user._id.toString()) {
            return response.status(403).json({ error: 'Permission denied' });
        }

        const now = moment.tz('Europe/Helsinki'); // or your desired timezone;
        const scheduleDateTime = getScheduleMoment(schedule);
        const diffInMinutes = scheduleDateTime.diff(now, 'minutes');

        // If the difference is less than or equal to 30 minutes, disallow deletion
        if (diffInMinutes <= 30) {
            return response.status(403).json({ error: 'Cannot delete a schedule less than 30 minutes before it starts' });
        }

        // If more than 30 minutes, proceed with deletion
        await Schedule.deleteOne({ _id: id });
        response.status(204).end(); // Successfully deleted

    } catch (error) {
        console.error('Error during deletion:', error.message);
        response.status(500).json({ error: 'Internal server error', details: error.message });
    }
});


module.exports = schedulesRouter;