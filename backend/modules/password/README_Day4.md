# Password Management (Service 2) - Day 4

This folder contains the frontend components and core controller logic I developed for the password management service on Day 4.

## Files added:

### 1. passwordController.js
This is the central logic hub for all password-related operations. It handles:
- **Forgot Password**: Generates a secure random token using the `crypto` library and hashes it before storage.
- **Reset Password**: Validates the new password against the security rules before updating the user record.
- **Change Password**: Handles updates for users who are already logged in and know their current password.

### 2. ResetPassword.jsx (Frontend)
A professional reset request page designed for the IITG portal. It includes:
- **IITG Domain Selection**: Limits requests to `@iitg.ac.in` or `@iitg.ernet.in`.
- **Bot Protection**: Implements a math-based verification captcha to prevent automated spam.
- **IITG Branding**: Styled with the institute's colors and logo.

### 3. ChangePassword.jsx (Frontend)
A comprehensive password update interface for authenticated users. Key features include:
- **Real-time Strength Meter**: Visual feedback on password complexity.
- **Complex Validation**: Enforces strict rules (length, uppercase, lowercase, digits, and special characters).
- **Security Checklists**: A dynamic list that checks off requirements as the user types.
