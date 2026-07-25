/**
 * Hexclave, wired so that the absence of keys can never break the product.
 *
 * Auth is worth screen time only for what it produces downstream: the signed-in
 * user becomes the Actor in the action log, the deciding party on the incident,
 * and the printed name on the evidence report's signature line. That is the
 * attribution chain that lets the document read as a business record. Nobody is
 * moved by a login form, so we never show one on camera.
 *
 * Scope, from trd.md §3: it gates the dashboard route and nothing else. /oncall,
 * the print route, and every /api route stay public — the phone has no session
 * and Phonely's callback certainly does not. A broken auth session must never be
 * able to block the phone, the call, or the PDF.
 */

import 'server-only';
import { HexclaveServerApp } from '@hexclave/next';

export const AUTH_ENABLED = Boolean(
  process.env.HEXCLAVE_SECRET_SERVER_KEY && process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
);

// Built through a factory so the cookie token store stays in the inferred type.
// Annotating it by hand widens the generic and the provider then rejects it.
function createApp() {
  return new HexclaveServerApp({
    tokenStore: 'nextjs-cookie',
    urls: {
      signIn: '/handler/sign-in',
      afterSignIn: '/',
      afterSignUp: '/',
      afterSignOut: '/handler/sign-in',
    },
  });
}

let cached: ReturnType<typeof createApp> | null = null;

/** Null when unconfigured. Constructing the app without keys throws. */
export function hexclaveApp(): ReturnType<typeof createApp> | null {
  if (!AUTH_ENABLED) return null;
  if (!cached) cached = createApp();
  return cached;
}

export interface OperatorIdentity {
  id: string;
  displayName: string;
  role: string;
  authenticated: boolean;
}

/**
 * Who is on duty. Falls back to the fixture manager when auth is off, so the
 * action log and the report always name somebody.
 */
export async function currentOperator(): Promise<OperatorIdentity> {
  const app = hexclaveApp();
  if (!app) {
    return {
      id: 'user_jreyes',
      displayName: 'Jordan Reyes',
      role: 'Regional Operations Manager',
      authenticated: false,
    };
  }

  try {
    const user = await app.getUser();
    if (!user) {
      return {
        id: 'user_jreyes',
        displayName: 'Jordan Reyes',
        role: 'Regional Operations Manager',
        authenticated: false,
      };
    }
    return {
      id: user.id,
      displayName: user.displayName ?? user.primaryEmail ?? 'Warden Operator',
      role: 'Regional Operations Manager',
      authenticated: true,
    };
  } catch {
    return {
      id: 'user_jreyes',
      displayName: 'Jordan Reyes',
      role: 'Regional Operations Manager',
      authenticated: false,
    };
  }
}
