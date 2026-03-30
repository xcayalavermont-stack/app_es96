import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemberRecord } from './huidDatabase';

// ─── Data Source Interface ────────────────────────────────────────────────────
// All screens use the exported functions below.
// To switch to a remote SQL database, implement this interface and swap it in
// at the "Active data source" line — no screen code needs to change.

interface MemberDataSource {
  loadAll(): Promise<MemberRecord[]>;
  saveAll(members: MemberRecord[]): Promise<void>;
}
//Right now uses AsyncStorageDataSource (local to each phone)
//When your SQL backend is ready, uncomment RemoteApiDataSource, fill in your API URL, and change one line — all phones will share the same members instantly
//AdminScreen and LoginScreen don't need any changes either way
// ─── AsyncStorage Implementation (current — local to each device) ─────────────

class AsyncStorageDataSource implements MemberDataSource {
  private readonly key = '@huid_members';

  async loadAll(): Promise<MemberRecord[]> {
    const raw = await AsyncStorage.getItem(this.key);
    return raw ? (JSON.parse(raw) as MemberRecord[]) : [];
  }

  async saveAll(members: MemberRecord[]): Promise<void> {
    await AsyncStorage.setItem(this.key, JSON.stringify(members));
  }
}

// ─── Remote SQL API Implementation (future — shared across all devices) ───────
// When your SQL backend is ready:
//   1. Uncomment and fill in RemoteApiDataSource below with your API URL
//   2. Change the active data source line to: new RemoteApiDataSource()
//   3. Every phone will instantly share the same member list
//
// class RemoteApiDataSource implements MemberDataSource {
//   private readonly baseUrl = 'https://your-api.com';
//
//   async loadAll(): Promise<MemberRecord[]> {
//     const res = await fetch(`${this.baseUrl}/members`);
//     return res.json();
//   }
//
//   async saveAll(members: MemberRecord[]): Promise<void> {
//     await fetch(`${this.baseUrl}/members`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(members),
//     });
//   }
// }

// ─── Active data source — swap this line to switch backends ──────────────────

const dataSource: MemberDataSource = new AsyncStorageDataSource();

// ─── Public API (used by screens — signatures stay the same after SQL swap) ──

export async function loadMembers(): Promise<MemberRecord[]> {
  return dataSource.loadAll();
}

export async function saveMembers(members: MemberRecord[]): Promise<void> {
  return dataSource.saveAll(members);
}

export async function addMember(m: MemberRecord): Promise<MemberRecord[]> {
  const members = await loadMembers();
  const updated = [...members, m];
  await saveMembers(updated);
  return updated;
}

export async function updateMember(
  huid: string,
  updates: Partial<MemberRecord>
): Promise<MemberRecord[]> {
  const members = await loadMembers();
  const updated = members.map((m) =>
    m.huid === huid ? { ...m, ...updates } : m
  );
  await saveMembers(updated);
  return updated;
}

export async function deleteMember(huid: string): Promise<MemberRecord[]> {
  const members = await loadMembers();
  const updated = members.filter((m) => m.huid !== huid);
  await saveMembers(updated);
  return updated;
}
