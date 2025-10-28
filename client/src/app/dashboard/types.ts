export interface UserProfile {
  username: string;
  handle: string;
  avatar: string;
  isConnected: boolean;
}

export interface TipActivity {
  id: string;
  recipientHandle: string;
  recipientAvatar?: string;
  amount: number;
  note?: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: string;
}

export interface AmountOption {
  value: number;
  label: string;
  isSelected?: boolean;
}

export type TipFormData = {
  recipientHandle: string;
  amount: number;
  note?: string;
};
