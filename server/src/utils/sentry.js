// Sentry error tracking integration
// Install with: npm install @sentry/node

let Sentry = null;

export const initializeSentry = () => {
    const sentryDsn = process.env.SENTRY_DSN;

    if (!sentryDsn) {
        console.log('Sentry DSN not configured - error tracking disabled');
        return null;
    }

    try {
        // Dynamic import to avoid errors if package not installed
        import ('@sentry/node').then((sentryModule) => {
            Sentry = sentryModule.default;

            Sentry.init({
                dsn: sentryDsn,
                environment: process.env.NODE_ENV || 'development',
                tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
                beforeSend(event, hint) {
                    // Filter out known operational errors
                    if (hint.originalException && hint.originalException.isOperational) {
                        return null; // Don't send operational errors to Sentry
                    }
                    return event;
                },
                integrations: [
                    new Sentry.Integrations.Http({ tracing: true }),
                    new Sentry.Integrations.Express({ app: null }),
                ],
            });

            console.log('✅ Sentry initialized');
        }).catch((error) => {
            console.warn('Sentry package not installed. Install with: npm install @sentry/node');
        });
    } catch (error) {
        console.warn('Failed to initialize Sentry:', error.message);
    }
};

export const captureException = (error, context = {}) => {
    if (!Sentry) return;

    Sentry.withScope((scope) => {
        // Add context
        if (context.user) {
            scope.setUser(context.user);
        }
        if (context.tags) {
            Object.keys(context.tags).forEach(key => {
                scope.setTag(key, context.tags[key]);
            });
        }
        if (context.extra) {
            Object.keys(context.extra).forEach(key => {
                scope.setExtra(key, context.extra[key]);
            });
        }

        Sentry.captureException(error);
    });
};

export const captureMessage = (message, level = 'info', context = {}) => {
    if (!Sentry) return;

    Sentry.withScope((scope) => {
        if (context.user) {
            scope.setUser(context.user);
        }
        if (context.tags) {
            Object.keys(context.tags).forEach(key => {
                scope.setTag(key, context.tags[key]);
            });
        }

        Sentry.captureMessage(message, level);
    });
};

export const setUser = (user) => {
    if (!Sentry) return;
    Sentry.setUser(user);
};

export default {
    initializeSentry,
    captureException,
    captureMessage,
    setUser
};