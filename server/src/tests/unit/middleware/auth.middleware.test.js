import { jest } from '@jest/globals';

const mockConfig = {
    security: {
        enableAuth: true,
        jwtSecret: 'secret',
    },
};

const mockJwtVerify = jest.fn();
const mockLogger = {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};

jest.unstable_mockModule('../../../config/config.js', () => ({
    default: mockConfig,
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        verify: (...args) => mockJwtVerify(...args),
    },
    verify: (...args) => mockJwtVerify(...args),
}));

jest.unstable_mockModule('../../../utils/logger.js', () => ({
    __esModule: true,
    default: mockLogger,
}));

const authMiddleware = await import('../../../middleware/auth.js');
const { socketAuthenticate, authorize } = authMiddleware;

describe('auth middleware', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        jest.clearAllMocks();
        mockConfig.security.enableAuth = true;
        process.env.NODE_ENV = 'test';
    });

    afterAll(() => {
        process.env.NODE_ENV = originalEnv;
    });

    describe('socketAuthenticate', () => {
        test('allows connection with demo user when auth disabled in non-production', () => {
            mockConfig.security.enableAuth = false;
            const socket = { handshake: {} };
            const next = jest.fn();

            socketAuthenticate(socket, next);

            expect(socket.user).toEqual({
                id: 'anonymous',
                username: 'anonymous',
                role: 'user',
            });
            expect(next).toHaveBeenCalledWith();
        });

        test('fails when auth disabled in production', () => {
            mockConfig.security.enableAuth = false;
            process.env.NODE_ENV = 'production';
            const socket = { handshake: {} };
            const next = jest.fn();

            socketAuthenticate(socket, next);

            expect(next).toHaveBeenCalledTimes(1);
            const [error] = next.mock.calls[0];
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain('Authentication cannot be disabled in production');
        });

        test('rejects when token missing', () => {
            mockConfig.security.enableAuth = true;
            const socket = { handshake: { auth: {}, query: {}, headers: {} } };
            const next = jest.fn();

            socketAuthenticate(socket, next);

            expect(next).toHaveBeenCalledTimes(1);
            const [error] = next.mock.calls[0];
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain('No token provided');
        });

        test('attaches decoded user on valid token', () => {
            mockConfig.security.enableAuth = true;
            const decodedUser = { id: 'user-1', role: 'operator' };
            mockJwtVerify.mockReturnValue(decodedUser);

            const socket = {
                handshake: {
                    auth: { token: 'valid-token' },
                    query: {},
                    headers: {},
                },
            };
            const next = jest.fn();

            socketAuthenticate(socket, next);

            expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', mockConfig.security.jwtSecret);
            expect(socket.user).toEqual(decodedUser);
            expect(next).toHaveBeenCalledWith();
        });

        test('propagates token expired error', () => {
            mockConfig.security.enableAuth = true;
            const error = new Error('expired');
            error.name = 'TokenExpiredError';
            mockJwtVerify.mockImplementation(() => {
                throw error;
            });

            const socket = {
                handshake: {
                    auth: { token: 'expired' },
                    query: {},
                    headers: {},
                },
            };
            const next = jest.fn();

            socketAuthenticate(socket, next);

            expect(next).toHaveBeenCalledTimes(1);
            const [err] = next.mock.calls[0];
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toContain('Token expired');
        });
    });

    describe('authorize', () => {
        test('bypasses when auth disabled', () => {
            mockConfig.security.enableAuth = false;
            const middleware = authorize(['admin']);
            const req = {};
            const res = {};
            const next = jest.fn();

            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        test('rejects when user missing', () => {
            mockConfig.security.enableAuth = true;
            const middleware = authorize(['admin']);
            const json = jest.fn();
            const res = { status: jest.fn(() => ({ json })) };

            middleware({ user: null }, res, jest.fn());

            expect(res.status).toHaveBeenCalledWith(401);
            expect(json).toHaveBeenCalled();
            expect(json.mock.calls[0][0].error).toContain('Authentication required');
        });

        test('rejects when role mismatch', () => {
            mockConfig.security.enableAuth = true;
            const middleware = authorize(['admin']);
            const json = jest.fn();
            const res = { status: jest.fn(() => ({ json })) };
            const next = jest.fn();

            middleware({ user: { role: 'viewer' } }, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(json.mock.calls[0][0].error).toContain('Access denied');
        });

        test('allows when role matches', () => {
            mockConfig.security.enableAuth = true;
            const middleware = authorize(['admin', 'operator']);
            const next = jest.fn();
            const res = { status: jest.fn() };

            middleware({ user: { role: 'operator' } }, res, next);

            expect(next).toHaveBeenCalledWith();
        });
    });
});
