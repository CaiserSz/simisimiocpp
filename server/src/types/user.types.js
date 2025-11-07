/**
 * User Type Definitions (JSDoc)
 * 
 * Created: 2025-01-11
 * Purpose: Type definitions for user-related entities
 */

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} role - User role
 * @property {string[]} permissions - User permissions
 * @property {boolean} isActive - Whether user is active
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {string|null} lastLogin - Last login timestamp
 */

/**
 * @typedef {Object} UserCreateRequest
 * @property {string} username - Username (required)
 * @property {string} email - Email address (required)
 * @property {string} password - Password (required, min 6 characters)
 * @property {string} [role] - User role (default: 'user')
 * @property {string} [firstName] - First name
 * @property {string} [lastName] - Last name
 */

/**
 * @typedef {Object} UserUpdateRequest
 * @property {string} [email] - Email address
 * @property {string} [firstName] - First name
 * @property {string} [lastName] - Last name
 * @property {string} [phone] - Phone number
 */

/**
 * @typedef {Object} PasswordUpdateRequest
 * @property {string} currentPassword - Current password (required)
 * @property {string} newPassword - New password (required, min 6 characters)
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email - Email address (required)
 * @property {string} password - Password (required)
 */

/**
 * @typedef {Object} AuthResponse
 * @property {boolean} success - Whether authentication was successful
 * @property {string} token - JWT token
 * @property {Object} user - User information (without password)
 */

export default {};