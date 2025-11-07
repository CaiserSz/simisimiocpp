/**
 * User Constants
 * 
 * Created: 2025-01-11
 * Purpose: Centralized user-related constants
 */

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    OPERATOR: 'operator',
    USER: 'user',
    GUEST: 'guest'
};

// User Permissions
export const USER_PERMISSIONS = {
    // Admin permissions
    ADMIN_ALL: '*',
    
    // Station permissions
    STATIONS_READ: 'stations:read',
    STATIONS_WRITE: 'stations:write',
    STATIONS_DELETE: 'stations:delete',
    STATIONS_START: 'stations:start',
    STATIONS_STOP: 'stations:stop',
    
    // Transaction permissions
    TRANSACTIONS_READ: 'transactions:read',
    TRANSACTIONS_WRITE: 'transactions:write',
    
    // Settings permissions
    SETTINGS_READ: 'settings:read',
    SETTINGS_WRITE: 'settings:write',
    
    // User management permissions
    USERS_READ: 'users:read',
    USERS_WRITE: 'users:write',
    USERS_DELETE: 'users:delete',
    
    // System permissions
    SYSTEM_BACKUP: 'system:backup',
    SYSTEM_RESTORE: 'system:restore',
    SYSTEM_CONFIG: 'system:config'
};

// Default Permissions by Role
export const DEFAULT_PERMISSIONS = {
    [USER_ROLES.ADMIN]: [USER_PERMISSIONS.ADMIN_ALL],
    [USER_ROLES.OPERATOR]: [
        USER_PERMISSIONS.STATIONS_READ,
        USER_PERMISSIONS.STATIONS_WRITE,
        USER_PERMISSIONS.TRANSACTIONS_READ,
        USER_PERMISSIONS.SETTINGS_READ
    ],
    [USER_ROLES.USER]: [
        USER_PERMISSIONS.STATIONS_READ,
        USER_PERMISSIONS.TRANSACTIONS_READ
    ],
    [USER_ROLES.GUEST]: [
        USER_PERMISSIONS.STATIONS_READ
    ]
};

// User Status
export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    DELETED: 'deleted'
};

// Password Requirements
export const PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: false,
    REQUIRE_NUMBERS: false,
    REQUIRE_SPECIAL: false
};

// JWT Token Expiration
export const JWT_EXPIRATION = {
    DEFAULT: '24h',
    SHORT: '1h',
    LONG: '7d',
    REMEMBER_ME: '30d'
};

export default {
    USER_ROLES,
    USER_PERMISSIONS,
    DEFAULT_PERMISSIONS,
    USER_STATUS,
    PASSWORD_REQUIREMENTS,
    JWT_EXPIRATION
};

