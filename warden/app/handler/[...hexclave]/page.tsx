import { HexclaveHandler } from '@hexclave/next';
import { hexclaveApp } from '@/hexclave/server';

/** Sign-in, sign-up, and account pages. Only reachable when Hexclave is configured. */
export default function Handler(props: unknown) {
  const app = hexclaveApp();
  if (!app) {
    return (
      <main style={{ padding: 40, fontFamily: 'monospace', color: '#7d8896' }}>
        Hexclave is not configured. Set NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
        NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY and HEXCLAVE_SECRET_SERVER_KEY, then restart.
      </main>
    );
  }
  return <HexclaveHandler fullPage app={app} routeProps={props} />;
}
