// Centralised password strength rules. Returns { ok: true } or { ok: false, error }.
// Used by changePassword, resetPassword, and any future create flows that take a
// raw password from input.

function validatePassword(newPassword, userId = '') {
  if (typeof newPassword !== 'string') return { ok: false, error: 'Password is required' };
  if (newPassword.length < 8 || newPassword.length > 16) {
    return { ok: false, error: 'Password must be 8-16 characters' };
  }
  if (!/[A-Z]/.test(newPassword)) return { ok: false, error: 'Password must contain an uppercase letter' };
  if (!/[a-z]/.test(newPassword)) return { ok: false, error: 'Password must contain a lowercase letter' };
  if (!/[0-9]/.test(newPassword)) return { ok: false, error: 'Password must contain a digit' };
  if (!/[!@#$%^&*]/.test(newPassword)) return { ok: false, error: 'Password must contain a special character' };
  if (userId && newPassword.toLowerCase().includes(String(userId).toLowerCase())) {
    return { ok: false, error: 'Password must not contain your username' };
  }
  return { ok: true };
}

module.exports = { validatePassword };
