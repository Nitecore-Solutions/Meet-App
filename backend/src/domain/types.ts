export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  name: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_media_id: string | null;
  relationship_status: string | null;
  looking_for: string | null;
  profession: string | null;
  education: string | null;
  drinking: string | null;
  smoking: string | null;
  eating: string | null;
  zodiac: string | null;
  languages: string[];
  interests: string[];
  interested_in: string | null;
  min_age: number;
  max_age: number;
  show_photos_only: boolean;
  show_other_cities: boolean;
  radius_km: number;
  hidden_fields: Record<string, boolean>;
  is_online: boolean;
  verified: boolean;
  facebook_verified: boolean;
  latitude: number | null;
  longitude: number | null;
  last_active_at: string | null;
  is_plus: boolean;
  plus_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthTokenKind = "verify_email" | "reset_password";

export type AuthTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  type: AuthTokenKind;
  email: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

export type RefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};

export type MediaPurpose = "avatar" | "gallery" | "chat";
export type MediaKind = "image" | "video";
export type MediaStatus = "pending" | "ready" | "deleted";

export type MediaRow = {
  id: string;
  owner_id: string;
  purpose: MediaPurpose;
  kind: MediaKind;
  storage_driver: "local";
  storage_key: string | null;
  mime_type: string;
  size_bytes: number;
  declared_duration_seconds: number | null;
  duration_seconds: number | null;
  duration_verified: boolean;
  status: MediaStatus;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  deleted_at: string | null;
};

export type UserPhotoRow = {
  id: string;
  user_id: string;
  media_id: string;
  position: number;
  created_at: string;
};

export type LikeRow = {
  from_user_id: string;
  to_user_id: string;
  created_at: string;
};

export type MatchRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  last_message_at: string | null;
};

export type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  type: "text" | "image" | "video";
  text: string | null;
  media_id: string | null;
  client_id: string | null;
  created_at: string;
  read_at: string | null;
  deleted_at: string | null;
};

export type ReadStateRow = {
  match_id: string;
  user_id: string;
  last_read_at: string;
};

export type BillingMode = "mock" | "order" | "subscription";
export type BillingStatus = "pending" | "completed" | "failed";

export type BillingCheckoutRow = {
  id: string;
  user_id: string;
  plan_id: string;
  mode: BillingMode;
  status: BillingStatus;
  amount: number;
  currency: string;
  provider_order_id: string | null;
  provider_subscription_id: string | null;
  payment_id: string | null;
  created_at: string;
  completed_at: string | null;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  provider: string;
  checkout_id: string | null;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_subscription_id: string | null;
  starts_at: string;
  ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
};

export type WebhookEventRow = {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  received_at: string;
  payload: string | null;
  processed_at: string | null;
  last_error: string | null;
};

export type PassRow = {
  from_user_id: string;
  to_user_id: string;
  created_at: string;
};

export type BlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};
