import type { CartItem, LabAssignments } from '../types';

const SUPABASE_URL = 'https://kjdybhbvwglpdyqwohbl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T3p8DrhHKdFp4CzL3eTzAw_IkSkpKCd';

// TODO: Replace these with valid UUIDs from your Supabase users and stockrooms tables.
const SUPABASE_USER_ID = '00000000-0000-0000-0000-000000000000';
const SUPABASE_STOCKROOM_ID = '00000000-0000-0000-0000-000000000000';
const TRANSACTION_TYPE = 'check_out';

async function supabaseRequest(path: string, init: RequestInit) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${response.statusText} – ${errorBody}`);
  }

  return response.json();
}

export async function syncTransaction(
  memberName: string,
  items: CartItem[],
  totalAmount: number,
  labAssignments?: LabAssignments
) {
  if (SUPABASE_USER_ID === '00000000-0000-0000-0000-000000000000' || SUPABASE_STOCKROOM_ID === '00000000-0000-0000-0000-000000000000') {
    throw new Error(
      'Supabase transaction sync is not configured. Set SUPABASE_USER_ID and SUPABASE_STOCKROOM_ID in src/data/transactionStore.ts.'
    );
  }

  const rows = items.map((item) => ({
    item_id: item.id,
    user_id: SUPABASE_USER_ID,
    stockroom_id: SUPABASE_STOCKROOM_ID,
    type: TRANSACTION_TYPE,
    quantity: item.quantity,
    notes: JSON.stringify({ memberName, labAssignments, totalAmount }),
  }));

  return supabaseRequest('transactions?return=representation', {
    method: 'POST',
    body: JSON.stringify(rows),
  });
}
