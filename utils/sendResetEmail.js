const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { DateTime } = require('luxon');
const PasswordReset = require('../models/passwordReset');
const transporter = require('../utils/transporteremail'); // Ensure this path is correct
require('dotenv').config({ path: '../.env' });

const sendResetEmail = ({ _id, email }, redirectURL, res) => {
    const resetString = crypto.randomBytes(32).toString('hex') + _id;

    PasswordReset.deleteMany({ userId: _id })
        .then(() => {
            const mailOptions = {
                from: process.env.AUTH_EMAIL,
                to: email,
                subject: 'Password Reset',
                html: `<p>You requested a password reset</p>
                       <p>The link expires in 60 min</p>
                       <p>Click <a href="${redirectURL}/reset/${_id}/${resetString}">here</a> to reset your password</p>`
            };

            const saltRounds = 10;
            bcrypt
                .hash(resetString, saltRounds)
                .then(hashedResetString => {
                    const passwordReset = new PasswordReset({
                        userId: _id,
                        resetString: hashedResetString,
                        createdAt: DateTime.now().setZone('Europe/Helsinki').toJSDate(),
                        expiresAt: DateTime.now().setZone('Europe/Helsinki').plus({ hours: 1 }).toJSDate()
                    });

                    passwordReset
                        .save()
                        .then(() => {
                            transporter
                                .sendMail(mailOptions)
                                .then(() => res.status(200).json({ message: 'Reset email sent' }))
                                .catch(err => {
                                    console.error('Error sending email:', err);
                                    res.status(500).json({ error: 'Email sending failed' });
                                });
                        })
                        .catch(err => {
                            console.error('Error saving reset token:', err);
                            res.status(500).json({ error: 'Could not save reset token' });
                        });
                })
                .catch(error => {
                    console.log('Error hashing reset string:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                });
        })
        .catch(error => {
            console.log('Error deleting previous reset tokens:', error);
            return res.status(500).json({ error: 'Internal server error' });
        });
};

module.exports = sendResetEmail;
