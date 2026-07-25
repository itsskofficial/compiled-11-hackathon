import Dashboard from '@/components/Dashboard';
import { currentOperator, hexclaveApp } from '@/hexclave/server';

/**
 * The dashboard, and the only route Hexclave gates. When auth is unconfigured
 * this renders straight through, so the loop is never blocked by a missing key.
 */
export default async function Page() {
  const app = hexclaveApp();
  if (app) {
    await app.getUser({ or: 'redirect' });
  }
  const operator = await currentOperator();
  return <Dashboard operator={operator} />;
}
