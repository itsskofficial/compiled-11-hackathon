/**
 * The phone's only subscription. One consumer, one event type.
 *
 * trd.md §3: the dashboard does not need SSE because it lives in the same tab as
 * everything that produces events. The phone is a different device, so this is
 * the single channel that exists.
 */

import { subscribe } from '@/lib/incidentServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let keepalive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      send(`retry: 2000\n\n`);
      send(`event: ready\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`);

      unsubscribe = subscribe(send);

      // Proxies and mobile radios drop idle connections; a comment every 15s
      // keeps the socket alive without emitting an event.
      keepalive = setInterval(() => {
        try {
          send(`: keepalive\n\n`);
        } catch {
          /* the cancel handler will clean up */
        }
      }, 15_000);
    },
    cancel() {
      unsubscribe?.();
      if (keepalive) clearInterval(keepalive);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
