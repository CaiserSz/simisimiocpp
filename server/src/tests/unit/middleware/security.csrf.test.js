import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { csrfProtection, generateCsrfToken } from '../../../middleware/security.js';
import config from '../../../config/config.js';

const originalEnableAuth = config.security.enableAuth;

describe('CSRF Protection Middleware', () => {
    let app;

    beforeAll(() => {
        config.security.enableAuth = true;
    });

    afterAll(() => {
        config.security.enableAuth = originalEnableAuth;
    });

    beforeEach(() => {
        app = express();
        app.use(cookieParser());
        app.use(express.json());

        app.get('/csrf-token', generateCsrfToken);
        app.get('/secure-endpoint', csrfProtection, (req, res) => {
            res.json({ success: true });
        });
        app.post('/secure-endpoint', csrfProtection, (req, res) => {
            res.json({ success: true });
        });
    });

    test('allows safe GET requests without token', async() => {
        await request(app)
            .get('/secure-endpoint')
            .expect(200);
    });

    test('enforces CSRF token after cookie is issued', async() => {
        const firstResponse = await request(app)
            .post('/secure-endpoint')
            .send({ foo: 'bar' })
            .expect(200);

        const csrfCookie = firstResponse.headers['set-cookie'].find((cookie) =>
            cookie.startsWith('XSRF-TOKEN='));
        expect(csrfCookie).toBeDefined();

        const secondResponse = await request(app)
            .post('/secure-endpoint')
            .set('Cookie', csrfCookie)
            .send({ foo: 'bar' })
            .expect(403);

        expect(secondResponse.body.error).toContain('CSRF token');
    });

    test('accepts POST with valid CSRF token', async() => {
        const tokenResponse = await request(app)
            .get('/csrf-token')
            .expect(200);

        const csrfCookie = tokenResponse.headers['set-cookie'].find((cookie) =>
            cookie.startsWith('XSRF-TOKEN='));
        expect(csrfCookie).toBeDefined();

        const token = tokenResponse.body.csrfToken;

        await request(app)
            .post('/secure-endpoint')
            .set('Cookie', csrfCookie)
            .set('X-XSRF-TOKEN', token)
            .send({ foo: 'bar' })
            .expect(200, { success: true });
    });

    test('rejects POST when header and cookie mismatch', async() => {
        const tokenResponse = await request(app)
            .get('/csrf-token')
            .expect(200);

        const csrfCookie = tokenResponse.headers['set-cookie'].find((cookie) =>
            cookie.startsWith('XSRF-TOKEN='));

        await request(app)
            .post('/secure-endpoint')
            .set('Cookie', csrfCookie)
            .set('X-XSRF-TOKEN', 'invalid-token')
            .send({ foo: 'bar' })
            .expect(403);
    });
});
