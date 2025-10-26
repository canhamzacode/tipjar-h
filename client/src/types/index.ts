export interface User {
  id: string;
  twitter_id: string | null;
  twitter_handle: string | null;
  name: string | null;
  profile_image_url: string | null;
  description: string | null;
  wallet_address: string | null;
  wallet_type: 'non-custodial' | 'custodial' | null;
  created_at: Date | null;
}

export interface ApiError {
  response?: {
    data?: {
      errors?: Array<{ message: string }>;
      message?: string;
    };
  };
  message: string;
}
