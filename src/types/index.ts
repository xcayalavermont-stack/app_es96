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

export type LabAssignments = {
  [labName: string]: CartItem[];
};

export type RootStackParamList = {
  Login: undefined;
  LoginSuccess: { memberName: string; memberLabs: string[] };
  Cart: { memberName: string; memberLabs: string[] };
  Checkout: { items: CartItem[]; memberName: string; labAssignments?: LabAssignments };
  Admin: undefined;
  LabAssignmentQuestion: { cartItems: CartItem[]; memberName: string; memberLabs: string[] };
  LabSelectOne: { cartItems: CartItem[]; memberName: string; memberLabs: string[] };
  LabSelectMany: { cartItems: CartItem[]; memberName: string; memberLabs: string[] };
  LabItemAssign: {
    cartItems: CartItem[];
    selectedLabs: string[];
    currentLabIndex: number;
    labAssignments: LabAssignments;
    memberName: string;
  };
};
