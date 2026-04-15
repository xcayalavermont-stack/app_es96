export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
}

interface ProductDataSource {
  loadAll(): Promise<Product[]>;
}

// Remote Supabase SQL backend support
const SUPABASE_URL = 'https://kjdybhbvwglpdyqwohbl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T3p8DrhHKdFp4CzL3eTzAw_IkSkpKCd';
// This connects to your Supabase schema using the `items` table.
// `items.code` is mapped to the app's `barcode` field.

class SupabaseProductDataSource implements ProductDataSource {
  async loadAll(): Promise<Product[]> {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/items?select=id,code,name,price`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to load products from Supabase');
    }

    const rows = await response.json();
    return (rows as Array<{
      id: string;
      code: string;
      name: string;
      price: number;
    }>).map((row) => ({
      id: row.id,
      barcode: row.code,
      name: row.name,
      price: row.price,
      stock: 0, // Placeholder, inventory not loaded
    }));
  }
}

const dataSource: ProductDataSource = new SupabaseProductDataSource();
// const dataSource: ProductDataSource = new LocalProductDataSource();

export async function loadProducts(): Promise<Product[]> {
  return dataSource.loadAll();
}

export function findProductByQuery(query: string, products: Product[]): Product | undefined {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return undefined;

  return products.find(
    (item) =>
      item.barcode === normalized || item.name.toLowerCase() === normalized
  );
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function filterProducts(query: string, products: Product[]): Product[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return products;

  const exactMatches = products.filter(
    (item) =>
      item.name.toLowerCase().includes(trimmed) ||
      item.barcode.toLowerCase().includes(trimmed)
  );

  // Include fuzzy matches for close typos
  const fuzzyMatches = products
    .filter((item) => !exactMatches.includes(item))
    .filter((item) => {
      const nameDist = levenshtein(trimmed, item.name.toLowerCase());
      const barcodeDist = levenshtein(trimmed, item.barcode);
      return nameDist <= 2 || barcodeDist <= 1;
    });

  return [...exactMatches, ...fuzzyMatches];
}
