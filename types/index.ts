export type Plan = "free" | "starter" | "pro" | "enterprise";
export type ProgramType = "stamp" | "points" | "steps";
export type Locale = "en" | "ar";

export type CardDetails = {
  description?: string;
  terms?: string;
  website?: string;
};

export type EnrollmentPageStyle = "classic" | "editorial" | "spotlight";

export type EnrollmentPageConfig = {
  style?: EnrollmentPageStyle;
  logo_url?: string;
  business_name?: string;
  program_name?: string;
  description?: string;
  background_color?: string;
  button_color?: string;
};

export type CardAppearance = {
  primary_color?: string;
  secondary_color?: string;
  background_image_url?: string;
  details?: CardDetails;
  enrollment_page?: EnrollmentPageConfig;
  /** Optional — powers the analytics revenue-impact KPI when set. Never estimated if absent. */
  reward_value?: number;
};

export type StampConfig = CardAppearance & {
  stamps_required: number;
  reward_description: string;
  icon: string;
};

export type PointsConfig = CardAppearance & {
  points_per_reward: number;
  reward_description: string;
  points_label: string;
};

export type StepStage = {
  key: string;
  label: string;
  threshold: number;
};

export type StepsConfig = CardAppearance & {
  stages: StepStage[];
};

export type ProgramConfig = StampConfig | PointsConfig | StepsConfig;

export type StampProgress = { stamps_collected: number };
export type PointsProgress = { points: number };
export type StepsProgress = {
  current_value: number;
  completed_stage_keys: string[];
};
export type Progress = StampProgress | PointsProgress | StepsProgress;

export type Merchant = {
  id: string;
  business_name: string;
  industry: string;
  logo_url: string | null;
  brand_color_primary: string;
  brand_color_secondary: string;
  plan: Plan;
  stripe_customer_id: string | null;
  locale_default: Locale;
  onboarding_completed: boolean;
  currency: string | null;
  average_order_value: number | null;
  timezone: string;
  notification_prefs: NotificationPrefs;
  created_at: string;
  updated_at: string;
};

/** Toggles a preference shell now — Phase 8 wires up the actual sends. */
export type NotificationPrefs = {
  reward_unlocked?: boolean;
  birthday?: boolean;
  expiring_reward?: boolean;
  inactive_customer?: boolean;
};

export type LoyaltyProgram = {
  id: string;
  merchant_id: string;
  name: string;
  type: ProgramType;
  is_active: boolean;
  config: ProgramConfig;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  merchant_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerProgress = {
  id: string;
  customer_id: string;
  program_id: string;
  pass_id: string;
  progress: Progress;
  apple_push_token: string | null;
  apple_auth_token: string;
  google_object_id: string | null;
  google_auth_token: string;
  created_at: string;
  updated_at: string;
};

export type ApiError = {
  error: { message: string; code: string };
};

export type ApiSuccess<T> = { data: T };

export type StaffRole = "owner" | "admin" | "manager" | "staff";
export type StaffStatus = "invited" | "active" | "revoked";

export type StaffAccount = {
  id: string;
  user_id: string;
  merchant_id: string;
  role: Exclude<StaffRole, "owner">;
  status: StaffStatus;
  invited_email: string;
  created_at: string;
  updated_at: string;
};
