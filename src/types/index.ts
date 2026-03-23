export interface User {
  username: string;
  token: string;
}

export interface CartItem {
  id: string;
  barcode: string;
  name: string;
  quantity: number;
  price: number;
}

export type RootStackParamList = {
  Login: undefined;
  Cart: undefined;
  Checkout: { items: CartItem[] };
};
