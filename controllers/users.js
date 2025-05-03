const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');
const { userExtractor, requireAdmin } = require('../utils/middleware');

// Create user (anyone can register, optional: restrict setting admin)
usersRouter.post('/', userExtractor, requireAdmin, async (req, res, next) => {
  const { username, name, password, role = 'user' } = req.body

  if (!username || !password) {
    const missingField = !username ? 'Username' : 'Password'
    return res.status(400).json({ error: `${missingField} is required` })
  }

  if (username.length < 3 || password.length < 3) {
    return res.status(400).json({ error: 'Username and password must be at least 3 characters long' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const user = new User({
      username,
      name,
      passwordHash,
      role // only admin can set this because of middleware
    })

    const savedUser = await user.save()
    res.status(201).json(savedUser)
  } catch (error) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ error: 'Username must be unique' })
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
