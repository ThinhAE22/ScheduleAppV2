require('dotenv').config({ path: '../.env' }); // 👈 manually set correct path

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const config = require('../utils/config')

console.log('MONGODB_URL:', process.env.MONGODB_URL)
console.log('FIRST_ADMIN_PWD:', process.env.FIRST_ADMIN_PWD)

const createAdmin = async () => {
  try {
    await mongoose.connect(config.MONGODB_URL)

    const password = config.FIRST_ADMIN_PWD
    const passwordHash = await bcrypt.hash(password, 10)

    const admin = new User({
      username: 'admin',
      name: 'Super Admin',
      passwordHash,
      role: 'admin',
    })

    await admin.save()
    console.log('✅ Admin user created successfully')
  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
  } finally {
    mongoose.connection.close()
  }
}

createAdmin()
