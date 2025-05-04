const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});


//console.log('Auth Email:', process.env.AUTH_EMAIL);
//console.log('Auth Pass:', process.env.AUTH_PASS);

module.exports = transporter;