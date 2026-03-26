import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemberRecord, HUID_DATABASE } from './huidDatabase';

const STORAGE_KEY = '@huid_members';

export async function loadMembers(): Promise<MemberRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return HUID_DATABASE;
  }
  return JSON.parse(raw) as MemberRecord[];
}

export async function saveMembers(members: MemberRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(members));
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
