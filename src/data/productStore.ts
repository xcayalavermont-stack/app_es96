export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
}

const localProducts: Product[] = [
  { id: 'p1', barcode: '000101', name: 'Pipette, 1000 µL', price: 12.5, stock: 24 },
  { id: 'p2', barcode: '000102', name: 'Pipette, 200 µL', price: 11.0, stock: 32 },
  { id: 'p3', barcode: '000103', name: 'Pipette Tips, Yellow', price: 8.75, stock: 120 },
  { id: 'p4', barcode: '000104', name: 'Beaker, 250 mL', price: 5.5, stock: 18 },
  { id: 'p5', barcode: '000105', name: 'Graduated Cylinder, 100 mL', price: 6.25, stock: 12 },
  { id: 'p6', barcode: '000106', name: 'Microtube Rack', price: 9.95, stock: 10 },
  { id: 'p7', barcode: '000107', name: 'Lab Notebook', price: 4.5, stock: 40 },
  { id: 'p8', barcode: '000108', name: 'Disposable Gloves, Large', price: 7.2, stock: 76 },
];

interface ProductDataSource {
  loadAll(): Promise<Product[]>;
}

class LocalProductDataSource implements ProductDataSource {
  async loadAll(): Promise<Product[]> {
    return localProducts;
  }
}

// Remote Supabase SQL backend support
const SUPABASE_URL = 'https://kjdybhbvwglpdyqwohbl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T3p8DrhHKdFp4CzL3eTzAw_IkSkpKCd';
// This connects to your Supabase schema using the `items` table.
// `items.code` is mapped to the app's `barcode` field.

class SupabaseProductDataSource implements ProductDataSource {
  async loadAll(): Promise<Product[]> {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/items?select=id,code,name,price,inventory(quantity)`,
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
      inventory?: Array<{ quantity: number }>;
    }>).map((row) => ({
      id: row.id,
      barcode: row.code,
      name: row.name,
      price: row.price,
      stock: row.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) ?? 0,
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

export function filterProducts(query: string, products: Product[]): Product[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return products;

  return products.filter(
    (item) =>
      item.name.toLowerCase().startsWith(normalized) ||
      item.barcode.startsWith(normalized)
  );
}
