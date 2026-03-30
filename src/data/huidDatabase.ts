export interface MemberRecord {
  cardUid: string;  // NFC card UID, e.g. "8A:AA:16:43"
  huid: string;     // 8-digit HUID, e.g. "12345678"
  name: string;     // Member's full name
  labs: string[];   // Lab affiliations, e.g. ["Soft Robotics", "Imaging"]
}
