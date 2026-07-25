/**
 * POST frames -> Anthropic -> structured assessment. trd.md §4.2 and §4.3.
 *
 * Two rules govern this handler.
 *
 * It never returns a non-200. On a missing key, a model error, or the 6-second
 * timeout it answers with the canned assessment, so no take is ever ruined by a
 * visible error state and the client has no failure branch to render.
 *
 * It uses tool calling with a strict schema rather than parsing JSON out of
 * prose. Shape enforcement belongs to the API, not to a regex written at speed.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { cannedClassification } from '@/lib/canned';
import { propertyById } from '@/lib/fixtures';
import { fullStamp, isoWithOffset } from '@/lib/time';
import { MODEL_CANDIDATES, vacancyNarrative } from '@/lib/types';
import type { Classification, ThreatLevel } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

const TIMEOUT_MS = 6000;

const TOOL = {
  name: 'report_assessment',
  description:
    'Report a security assessment of the supplied camera frames. Call exactly once.',
  input_schema: {
    type: 'object' as const,
    properties: {
      person_detected: { type: 'boolean', description: 'Is any person visible in the frames.' },
      person_count: { type: 'integer', description: 'Number of distinct people visible. 0 if none.' },
      behavior: {
        type: 'string',
        description:
          'A single clause under 12 words, written the way a security operator would log it. Examples: "attempting door, no uniform", "transiting parking area, no interaction".',
      },
      uniformed: {
        type: 'boolean',
        description: 'Is any person visibly uniformed, badged, or with a marked vehicle.',
      },
      threat: {
        type: 'integer',
        enum: [1, 2, 3, 4, 5],
        description: 'Threat level, applying the rubric strictly.',
      },
      rationale: {
        type: 'string',
        description: 'Two or three sentences citing only what is visibly supported by the frames.',
      },
    },
    required: ['person_detected', 'person_count', 'behavior', 'uniformed', 'threat', 'rationale'],
  },
};

function systemPrompt(propertyId: string): string {
  const p = propertyById(propertyId);
  return `You are Warden, an AI security operator monitoring residential and commercial
real estate. You receive consecutive frames from a fixed security camera and
assess whether what you see requires human intervention.

You are looking at: ${p.propertyName}, ${p.unit}.
Lease state: ${p.leaseState}. This unit is ${vacancyNarrative(p)}.
Local time: ${fullStamp()}.

Assess only what is visibly supported by the frames. Do not speculate about
intent beyond observable behavior. Do not guess identity, age, race, or gender —
describe only what bears on the security assessment.

THREAT RUBRIC — apply strictly:
1  No person, or a person clearly authorized (uniformed contractor, visible badge,
   marked vehicle) behaving consistently with authorized work.
2  A person present at the perimeter, transiting, no interaction with the structure.
   Delivery, passerby, someone at the wrong address.
3  A person interacting with the structure at an unusual hour, or lingering with
   no apparent purpose. Testing a handle, looking through a window.
4  A person actively attempting entry — forcing a door or window, defeating a lock,
   carrying tools — or multiple people coordinating at an unoccupied property.
5  Entry achieved, property damage in progress, weapon visible, or an immediate
   threat to a person.

An unoccupied property raises the significance of any interaction with the
structure. A vacant unit has no legitimate visitor at night.

Call report_assessment exactly once. behavior must be a single clause, under
12 words, written the way a security operator would log it — for example
"attempting door, no uniform" or "transiting parking area, no interaction".`;
}

function splitDataUri(uri: string): { mediaType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.*)$/.exec(uri);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

export async function POST(req: Request) {
  let propertyId = 'PROP-MAPLE-GROVE-4B';

  try {
    const body = (await req.json()) as { propertyId?: string; frames?: string[] };
    propertyId = body.propertyId ?? propertyId;
    const frames = (body.frames ?? []).map(splitDataUri).filter(Boolean) as {
      mediaType: string;
      data: string;
    }[];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        classification: cannedClassification('unconfigured', 'ANTHROPIC_API_KEY not set'),
      });
    }
    if (!frames.length) {
      return NextResponse.json({
        classification: cannedClassification('unconfigured', 'no frames supplied'),
      });
    }

    const client = new Anthropic({ apiKey, maxRetries: 0, timeout: TIMEOUT_MS });

    const content: Anthropic.MessageParam['content'] = [
      ...frames.map((f, i) => [
        { type: 'text' as const, text: `Frame ${i + 1} of ${frames.length}:` },
        {
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: f.mediaType as 'image/jpeg', data: f.data },
        },
      ]).flat(),
      {
        type: 'text' as const,
        text: 'Assess these frames and call report_assessment exactly once.',
      },
    ];

    let lastError: unknown = null;

    // Model ids move. Advance past a 404 rather than failing the demo.
    for (const model of MODEL_CANDIDATES) {
      try {
        const message = await client.messages.create({
          model,
          max_tokens: 700,
          system: systemPrompt(propertyId),
          tools: [TOOL],
          tool_choice: { type: 'tool', name: 'report_assessment' },
          messages: [{ role: 'user', content }],
        });

        const block = message.content.find((b) => b.type === 'tool_use');
        if (!block || block.type !== 'tool_use') throw new Error('no tool_use block returned');

        const raw = block.input as Record<string, unknown>;
        const classification: Classification = {
          at: isoWithOffset(),
          model: message.model ?? model,
          personDetected: Boolean(raw.person_detected),
          personCount: Number(raw.person_count ?? 0),
          behavior: String(raw.behavior ?? 'unspecified'),
          uniformed: Boolean(raw.uniformed),
          threat: Math.min(5, Math.max(1, Number(raw.threat ?? 1))) as ThreatLevel,
          rationale: String(raw.rationale ?? ''),
          raw, // verbatim model output — the report prints this
        };

        return NextResponse.json({ classification });
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number }).status;
        if (status === 404) continue; // wrong model id, try the next candidate
        break;
      }
    }

    const reason =
      lastError instanceof Error ? `${lastError.name}: ${lastError.message}` : 'vision call failed';
    return NextResponse.json({
      classification: cannedClassification(MODEL_CANDIDATES[0] ?? 'unknown', reason),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'malformed request';
    return NextResponse.json({
      classification: cannedClassification('unknown', reason),
    });
  }
}
