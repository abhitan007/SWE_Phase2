# Password Management (Service 2) - Day 3

This folder contains the additional helper files I wrote for the password management service on Day 3.

## Files added:

### 1. ResetToken.js
This file defines the Mongoose schema for storing password reset tokens. It links a unique token hash to a user and includes a TTL (Time To Live) index that automatically deletes the token from the database after 1 hour. This ensures that reset links are only valid for a limited time, improving the overall security of the account recovery process.
