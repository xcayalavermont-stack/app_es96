import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemberRecord } from './huidDatabase';

interface MemberDataSource {
  loadAll(): Promise<MemberRecord[]>;
  saveAll(members: MemberRecord[]): Promise<void>;
  add(member: MemberRecord): Promise<void>;
  update(huid: string, updates: Partial<MemberRecord>): Promise<void>;
  remove(huid: string): Promise<void>;
}

export function normalizeCardUid(cardUid: string): string {
  const trimmed = cardUid.trim().toUpperCase();
  if (!trimmed) return '';

  const cleaned = trimmed.replace(/[:-\s]/g, '');
  if (!/^[0-9A-F]*$/.test(cleaned)) {
    throw new Error(
      'Card UID must contain only hexadecimal characters and optional separators like ":" or "-".'
    );
  }
  if (cleaned.length === 0) return '';
  if (cleaned.length % 2 !== 0) {
    throw new Error('Card UID must contain an even number of hexadecimal digits.');
  }

  return cleaned.match(/.{1,2}/g)!.join(':');
}

const SUPABASE_URL = 'https://kjdybhbvwglpdyqwohbl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T3p8DrhHKdFp4CzL3eTzAw_IkSkpKCd';

async function supabaseRequest(path: string, init: RequestInit) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${response.statusText} – ${errorBody}`);
  }

  return response.json();
}

function mapSupabaseUserToMember(user: any): MemberRecord {
  return {
    cardUid: user.card_uid ?? '',
    huid: user.huid ?? '',
    name: user.name ?? '',
    email: user.email ?? '',
    labs: Array.isArray(user.labs) ? user.labs : [],
  };
}

class AsyncStorageDataSource implements MemberDataSource {
  private readonly key = '@huid_members';

  async loadAll(): Promise<MemberRecord[]> {
    const raw = await AsyncStorage.getItem(this.key);
    const members = raw ? (JSON.parse(raw) as MemberRecord[]) : [];
    // Backward compatibility: add email if missing
    return members.map(member => ({
      ...member,
      email: member.email || '',
    }));
  }

  async saveAll(members: MemberRecord[]): Promise<void> {
    await AsyncStorage.setItem(this.key, JSON.stringify(members));
  }

  async add(member: MemberRecord): Promise<void> {
    const members = await this.loadAll();
    await this.saveAll([...members, member]);
  }

  async update(huid: string, updates: Partial<MemberRecord>): Promise<void> {
    const members = await this.loadAll();
    const updated = members.map((member) =>
      member.huid === huid ? { ...member, ...updates } : member
    );
    await this.saveAll(updated);
  }

  async remove(huid: string): Promise<void> {
    const members = await this.loadAll();
    const updated = members.filter((member) => member.huid !== huid);
    await this.saveAll(updated);
  }
}

const localMemberDataSource = new AsyncStorageDataSource();

class SupabaseMemberDataSource implements MemberDataSource {
  async loadAll(): Promise<MemberRecord[]> {
    try {
      const rows = await supabaseRequest(
        'users?select=card_uid,huid,name,labs&order=name.asc',
        { method: 'GET' }
      );

      return Array.isArray(rows)
        ? rows.map(mapSupabaseUserToMember)
        : [];
    } catch (error) {
      console.warn('Supabase member load failed, falling back to local storage.', error);
      return localMemberDataSource.loadAll();
    }
  }

  async saveAll(members: MemberRecord[]): Promise<void> {
    if (members.length === 0) {
      return;
    }

    const payload = members.map((member) => ({
      card_uid: normalizeCardUid(member.cardUid),
      huid: member.huid,
      name: member.name,
      email: member.email,
      labs: member.labs,
    }));

    try {
      await supabaseRequest('users?on_conflict=huid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Supabase member save failed, falling back to local storage.', error);
      await localMemberDataSource.saveAll(members);
    }
  }

  async add(member: MemberRecord): Promise<void> {
    try {
      await this.saveAll([member]);
    } catch (error) {
      console.warn('Supabase member add failed, falling back to local storage.', error);
      await localMemberDataSource.add(member);
    }
  }

  async update(huid: string, updates: Partial<MemberRecord>): Promise<void> {
    const body: any = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.email !== undefined) body.email = updates.email;
    if (updates.cardUid !== undefined) body.card_uid = normalizeCardUid(updates.cardUid);
    if (updates.labs !== undefined) body.labs = updates.labs;

    if (Object.keys(body).length === 0) {
      return;
    }

    try {
      await supabaseRequest(`users?huid=eq.${encodeURIComponent(huid)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.warn('Supabase member update failed, falling back to local storage.', error);
      await localMemberDataSource.update(huid, updates);
    }
  }

  async remove(huid: string): Promise<void> {
    try {
      await supabaseRequest(`users?huid=eq.${encodeURIComponent(huid)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Supabase member delete failed, falling back to local storage.', error);
      await localMemberDataSource.remove(huid);
    }
  }
}

const dataSource: MemberDataSource = new SupabaseMemberDataSource();

export async function loadMembers(): Promise<MemberRecord[]> {
  return dataSource.loadAll();
}

export async function saveMembers(members: MemberRecord[]): Promise<void> {
  return dataSource.saveAll(members);
}

export async function addMember(m: MemberRecord): Promise<MemberRecord[]> {
  await dataSource.add(m);
  return loadMembers();
}

export async function updateMember(
  huid: string,
  updates: Partial<MemberRecord>
): Promise<MemberRecord[]> {
  await dataSource.update(huid, updates);
  return loadMembers();
}

export async function deleteMember(huid: string): Promise<MemberRecord[]> {
  await dataSource.remove(huid);
  return loadMembers();
}
