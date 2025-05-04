const express = require('express');
const router = express.Router();
const User = require('../models/user');
const PasswordReset = require('../models/passwordReset');
const sendResetEmail = require('../utils/sendResetEmail');
const bcrypt = require('bcrypt');

router.post('/request-reset', async (req, res) => {
  const { email, redirectURL } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send reset email with user object
    sendResetEmail(user, redirectURL, res);

  } catch (error) {
    console.error('Error in request-reset route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/resetPassword', async (req, res) => {
    let { userId, resetString, newPassword } = req.body;

    try {
        // Find password reset entry
        const resetEntry = await PasswordReset.findOne({ userId });

        if (!resetEntry) {
            return res.status(400).json({ error: 'Invalid or expired password reset token' });
        }

        const expireAt = resetEntry.expiresAt;
        const hashedResetString = resetEntry.resetString;

        // Check if the reset token is expired
        if (expireAt < Date.now()) {
            await PasswordReset.deleteOne({ userId });
            return res.status(400).json({ error: 'Token expired' });
        }

        // Compare the provided reset string with the hashed one
        const isMatch = await bcrypt.compare(resetString, hashedResetString);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid reset password details' });
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user's password in the User collection
        await User.updateOne({ _id: userId }, { passwordHash: hashedNewPassword });

        // Delete the password reset entry
        await PasswordReset.deleteOne({ userId });

        return res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.log('Error during password reset process:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
