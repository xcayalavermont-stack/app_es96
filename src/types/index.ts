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
  LoginSuccess: { memberName: string };
  Cart: { memberName: string };
  Checkout: { items: CartItem[]; memberName: string };
  Admin: undefined;
};
