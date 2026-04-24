# Password Management (Service 2) - Day 5

This folder contains the routing layer and the foundational data model used for the password management service on Day 5.

## Files added:

### 1. passwordRoutes.js
The routing layer that connects the API endpoints to the controller logic. It incorporates several security measures:
- **Audit Logging**: Every password-related action (forgot, reset, change) is tracked by the `auditLogger` for security monitoring.
- **Authentication**: Ensures only logged-in users can access the "Change Password" endpoint.
- **Rate Limiting**: Includes a placeholder for rate limiting to prevent brute-force attacks on the forgot/reset flows.

### 2. User.js (Core Model)
The primary user schema which is essential for password security:
- **Bcrypt Hashing**: Uses a `pre-save` hook to automatically hash passwords with a salt of 10 rounds before they ever hit the database.
- **Secure Comparison**: Includes a custom method `comparePassword` to safely verify user credentials during login or password changes without exposing hashed data.
