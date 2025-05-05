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
    const { day, timeWashing, timeDryer, washingMachine, dryerMachine } = request.body;
    const user = request.user;

    if (!day) {
        return response.status(400).json({ error: 'Day are required' });
    }

    // If neither washing nor dryer pair is fully provided
    const hasWashing = timeWashing && washingMachine;
    const hasDryer = timeDryer && dryerMachine;

    if (!hasWashing && !hasDryer) {
        return response.status(400).json({ error: 'At least one machine-time pair (washing or dryer) is required' });
    }

    const overlappingConditions = [];

    if (washingMachine && timeWashing) {
    overlappingConditions.push({
        day,
        washingMachine,
        timeWashing
    });
    }

    if (dryerMachine && timeDryer) {
    overlappingConditions.push({
        day,
        dryerMachine,
        timeDryer
    });
    }

    if (overlappingConditions.length > 0) {
    const conflict = await Schedule.findOne({ $or: overlappingConditions });

    if (conflict) {
        return response.status(400).json({ error: 'This time slot is already booked for the selected machine.' });
    }
    }


    try {
        // Check if the user already has any schedule (i.e., one per week)
        const hasExistingBooking = await Schedule.findOne({ user: user._id });

        if (hasExistingBooking) {
            return response.status(400).json({ error: 'You already have a booking for this week' });
        }

        const schedule = new Schedule({
            day,
            timeWashing,
            timeDryer,
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

    function getScheduleMoment(schedule) {
        const day = schedule.day; // e.g. "Sunday"
        const time = schedule.timeWashing || schedule.timeDryer; 
        const [hour, minute] = time.split(':').map(Number);
 
        let scheduleMoment = moment.tz('Europe/Helsinki').isoWeekday(day).hour(hour).minute(minute).second(0);
    
    
        return scheduleMoment;
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
        const scheduleDateTime = getScheduleMoment(schedule);
        console.log("Current time (now):", now.format());
        console.log("Scheduled time (scheduleDateTime):", scheduleDateTime.format());

        const diffInMinutes = scheduleDateTime.diff(now, 'minutes');
        console.log("Time difference in minutes:", diffInMinutes);

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