/**
 * NFC Card UID → HUID Mapping Database
 *
 * To add a member:
 *   1. Have them tap their HUID card to get the UID (format: "XX:XX:XX:XX")
 *   2. Add a new entry below with their card UID, 8-digit HUID, and name
 *
 * Card UID format: colon-separated hex bytes, uppercase (e.g. "8A:AA:16:43")
 * HUID format: 8-digit Harvard University ID number (as a string)
 */

export interface MemberRecord {
  cardUid: string;  // NFC card UID, e.g. "8A:AA:16:43"
  huid: string;     // 8-digit HUID, e.g. "12345678"
  name: string;     // Member's full name
  labs: string[];   // Lab affiliations, e.g. ["Soft Robotics", "Imaging"]
}

// ─── Add members here ───────────────────────────────────────────────────────

export const HUID_DATABASE: MemberRecord[] = [
  // Example entry — replace with real members:
  // { cardUid: '8A:AA:16:43', huid: '12345678', name: 'Xavier Example' },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

/** Look up a member by their NFC card UID. Returns undefined if not found. */
export function lookupByCardUid(uid: string): MemberRecord | undefined {
  const normalized = uid.toUpperCase().trim();
  return HUID_DATABASE.find((m) => m.cardUid.toUpperCase() === normalized);
}

/** Look up a member by their HUID. Returns undefined if not found. */
export function lookupByHuid(huid: string): MemberRecord | undefined {
  return HUID_DATABASE.find((m) => m.huid === huid.trim());
}
