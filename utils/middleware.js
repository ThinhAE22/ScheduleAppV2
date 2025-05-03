const logger = require('./logger')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(401).json({ error: 'token invalid' })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }

  next(error)
}

const userExtractor = async (request, response, next) => {
  const token = request.get('authorization')?.replace('Bearer ', '');

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

      // Attach the user to the request object
      request.user = user;
      next();
  } catch (error) {
      return response.status(401).json({ error: 'Token invalid' });
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

module.exports = {
  userExtractor,
  requestLogger,
  unknownEndpoint,
  errorHandler,
  requireAdmin
}