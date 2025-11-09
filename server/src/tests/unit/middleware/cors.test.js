import { jest } from '@jest/globals';
import { createCorsOptions, corsValidation } from '../../../middleware/cors.js';
import config from '../../../config/config.js';

const originalAllowedOrigins = [...config.cors.allowedOrigins];
const originalPort = config.port;

describe('CORS Middleware', () => {
    beforeEach(() => {
        config.cors.allowedOrigins = ['https://app.example.com'];
        config.port = 3001;
    });

    afterAll(() => {
        config.cors.allowedOrigins = originalAllowedOrigins;
        config.port = originalPort;
    });

    test('createCorsOptions allows fallback localhost origin', (done) => {
        const options = createCorsOptions();
        options.origin(`http://localhost:${config.port}`, (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);
            done();
        });
    });

    test('createCorsOptions allows allowed origin', (done) => {
        const options = createCorsOptions();
        options.origin('https://app.example.com', (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);
            done();
        });
    });

    test('createCorsOptions rejects disallowed origin', (done) => {
        const options = createCorsOptions();
        options.origin('https://malicious.example.com', (err) => {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toContain('Not allowed by CORS');
            done();
        });
    });

    test('corsValidation blocks malformed origin', () => {
        const req = {
            headers: { origin: 'ftp://bad-protocol.example.com' },
            ip: '127.0.0.1',
            method: 'GET',
            originalUrl: '/test',
        };

        const json = jest.fn();
        const res = {
            status: jest.fn(() => ({ json })),
        };

        corsValidation(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(403);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Invalid origin format',
        }));
    });

    test('corsValidation accepts localhost fallback', () => {
        const req = {
            headers: { origin: `http://localhost:${config.port}` },
            ip: '127.0.0.1',
            method: 'GET',
            originalUrl: '/test',
        };

        const next = jest.fn();

        corsValidation(req, {
            status: jest.fn(),
        }, next);

        expect(next).toHaveBeenCalled();
    });
});
