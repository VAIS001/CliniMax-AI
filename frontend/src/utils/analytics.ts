import posthog from 'posthog-js';

export const initPostHog = () => {
  const key = import.meta.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = import.meta.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (key) {
    posthog.init(key, {
      api_host: host,
      person_profiles: 'identified_only',
    });
  }
};

export { posthog };
