const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');
const { userExtractor, requireAdmin } = require('../utils/middleware');

// Create user (anyone can register, optional: restrict setting admin)
usersRouter.post('/', userExtractor, requireAdmin, async (req, res, next) => {
  const { username, email, name, password, role = 'user' } = req.body

  if (!username || !password || !email) {
    const missingFields = []
    if (!username) missingFields.push('Username')
    if (!email) missingFields.push('Email')
    if (!password) missingFields.push('Password')
    return res.status(400).json({ error: `${missingFields.join(', ')} required` })
  }

  if (username.length < 3 || password.length < 3) {
    return res.status(400).json({ error: 'Username and password must be at least 3 characters long' })
  }

  // Basic email format check
  const emailRegex = /\S+@\S+\.\S+/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const user = new User({
      username,
      email,
      name,
      passwordHash,
      role
    })

    const savedUser = await user.save()
    res.status(201).json(savedUser)
  } catch (error) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
      const duplicateKey = Object.keys(error.keyValue)[0]
      return res.status(400).json({ error: `${duplicateKey.charAt(0).toUpperCase() + duplicateKey.slice(1)} must be unique` })
    }
    next(error)
  }
})




usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({}).populate('schedules')
  response.json(users);
});

// Delete user (admin only)
usersRouter.delete('/:id', userExtractor, requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(400).json({ error: 'Invalid user ID' })
  }
})

module.exports = usersRouter;
