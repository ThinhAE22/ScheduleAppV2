require('dotenv').config()

const PORT = process.env.PORT

const FIRST_ADMIN_PWD = process.env.FIRST_ADMIN_PWD

const MONGODB_URL = process.env.NODE_ENV === 'test' 
  ? process.env.TEST_MONGODB_URL
  : process.env.MONGODB_URL

module.exports = {
  FIRST_ADMIN_PWD,
  MONGODB_URL,
  PORT
}