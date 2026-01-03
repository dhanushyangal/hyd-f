// instrumentation-client.ts
import posthog from 'posthog-js'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (posthogKey) {
    posthog.init(posthogKey, {
        api_host: posthogHost || 'https://app.posthog.com',
        defaults: '2025-11-30'
    });
}

