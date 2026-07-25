/**
 * The faked PMS. trd.md §2.
 *
 * All six properties, owners, agents, and addresses are fictional. The rail
 * labels this feed SIMULATED on screen — an unlabeled fake costs you the room.
 *
 * Timestamps are hardcoded rather than computed so the server and client render
 * identical strings (no hydration mismatch) and so the report reads the same in
 * every take.
 */

import type { PropertyRef } from './types';

const TZ = 'America/Los_Angeles';

export const PROPERTIES: PropertyRef[] = [
  {
    propertyId: 'PROP-MAPLE-GROVE-4B',
    propertyName: 'Maple Grove Apartments',
    unit: '4B',
    addressLine: '1841 Maple Grove Terrace, Building 4',
    cityStateZip: 'Sacramento, CA 95818',
    ownerOfRecord: 'Maple Grove Residential Holdings, LLC',
    managingAgent: 'Northbridge Property Management',
    leaseState: 'vacant',
    turnoverDay: 12,
    turnoverLength: 21,
    lastAuthorizedEntry: { at: '2026-07-22T14:05:00.000-07:00', by: 'Vantage Flooring (vendor, escorted)' },
    cameraId: 'CAM-4B-REAR',
    detail: 'Turnover day 12 of 21',
    timezone: TZ,
  },
  {
    propertyId: 'PROP-MAPLE-GROVE-2A',
    propertyName: 'Maple Grove Apartments',
    unit: '2A',
    addressLine: '1841 Maple Grove Terrace, Building 2',
    cityStateZip: 'Sacramento, CA 95818',
    ownerOfRecord: 'Maple Grove Residential Holdings, LLC',
    managingAgent: 'Northbridge Property Management',
    leaseState: 'occupied',
    cameraId: 'CAM-2A-REAR',
    detail: 'Tenant in place',
    timezone: TZ,
  },
  {
    propertyId: 'PROP-CORBIN-SFR',
    propertyName: 'Corbin Street SFR',
    unit: 'Whole home',
    addressLine: '412 Corbin Street',
    cityStateZip: 'Stockton, CA 95204',
    ownerOfRecord: 'Cordell SFR Fund II, LP',
    managingAgent: 'Northbridge Property Management',
    leaseState: 'vacant',
    turnoverDay: 47,
    lastAuthorizedEntry: { at: '2026-06-09T09:40:00.000-07:00', by: 'B. Okafor (asset manager)' },
    cameraId: 'CAM-CORBIN-FRONT',
    detail: 'REO, day 47 vacant',
    timezone: TZ,
  },
  {
    propertyId: 'PROP-ALDER-POINT-12',
    propertyName: 'Alder Point',
    unit: '12',
    addressLine: '77 Alder Point Road',
    cityStateZip: 'Roseville, CA 95661',
    ownerOfRecord: 'Alder Point Venture, LLC',
    managingAgent: 'Northbridge Property Management',
    leaseState: 'notice',
    cameraId: 'CAM-AP12-SIDE',
    detail: 'Move-out in 3 days',
    timezone: TZ,
  },
  {
    propertyId: 'PROP-KESTREL-RIDGE',
    propertyName: 'Kestrel Ridge Estate',
    unit: 'Whole home',
    addressLine: '9 Kestrel Ridge Lane',
    cityStateZip: 'Truckee, CA 96161',
    ownerOfRecord: 'Held in trust — Hollis Family Office',
    managingAgent: 'Hollis Family Office (direct)',
    leaseState: 'seasonal_vacant',
    lastAuthorizedEntry: { at: '2026-05-30T11:15:00.000-07:00', by: 'Ridgeline Caretaking (vendor)' },
    cameraId: 'CAM-KR-GATE',
    detail: 'Owner absent 11 months/yr',
    timezone: TZ,
  },
  {
    propertyId: 'PROP-HARBOR-YARDS-II',
    propertyName: 'Harbor Yards Phase II',
    unit: 'Construction',
    addressLine: '2200 Harbor Yards Way',
    cityStateZip: 'West Sacramento, CA 95691',
    ownerOfRecord: 'Harbor Yards Development Partners',
    managingAgent: 'Keel & Marrow General Contractors',
    leaseState: 'construction',
    cameraId: 'CAM-HY2-YARD',
    detail: 'Copper theft exposure',
    timezone: TZ,
  },
];

/** The hero. The demo fires here. */
export const HERO_PROPERTY_ID = 'PROP-MAPLE-GROVE-4B';

export function propertyById(id: string): PropertyRef {
  return PROPERTIES.find((p) => p.propertyId === id) ?? PROPERTIES[0];
}

/** Portfolio-scale number for the left rail. Fictional, and never spoken as a stat. */
export const DOORS_MONITORED = 40312;

/**
 * The guard-dispatch marketplace. Dispatch itself is simulated; the vendor's
 * business status is genuinely validated through VOYGR before we would dispatch.
 */
export const GUARD_VENDOR = {
  name: 'Sentinel Response Group',
  addressLine: '1200 Front Street, Suite 210',
  cityStateZip: 'Sacramento, CA 95814',
  phone: '+1 916 555 0142',
};

/** The on-call manager. Replaced by the Hexclave-authenticated user when auth is on. */
export const ONCALL_MANAGER = {
  kind: 'human' as const,
  id: 'user_jreyes',
  displayName: 'Jordan Reyes',
  role: 'Regional Operations Manager',
};
