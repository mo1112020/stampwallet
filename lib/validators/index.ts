import { z } from "zod";

const cardAppearanceSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_image_url: z.string().url().optional(),
  // 0-100 percentages, CSS object-position semantics — see
  // types/index.ts's BackgroundImagePosition. Absent = centered (unchanged
  // pre-existing behavior).
  background_image_position: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional(),
  details: z.object({
    description: z.string().max(500).optional(),
    terms: z.string().max(1000).optional(),
    website: z.string().url().optional(),
  }).optional(),
  enrollment_page: z.object({
    style: z.enum(["classic", "editorial", "spotlight"]).optional(),
    logo_url: z.string().url().optional(),
    business_name: z.string().max(100).optional(),
    program_name: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    button_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }).optional(),
  reward_value: z.number().min(0).optional(),
  expiration: z
    .object({
      enabled: z.boolean(),
      days: z.number().int().min(1).max(365),
    })
    .optional(),
  barcode_style: z.enum(["qr", "pdf417"]).optional(),
});

export const stampConfigSchema = cardAppearanceSchema
  .extend({
    stamps_required: z.number().int().min(1).max(25),
    reward_description: z.string().min(1).max(200),
    icon: z.string().min(1).max(16),
    initial_stamps: z.number().int().min(0).max(25).optional(),
  })
  .refine((data) => (data.initial_stamps ?? 0) <= data.stamps_required, {
    message: "initial_stamps cannot exceed stamps_required",
    path: ["initial_stamps"],
  });

export const pointsConfigSchema = cardAppearanceSchema.extend({
  points_per_reward: z.number().int().min(1),
  reward_description: z.string().min(1).max(200),
  points_label: z.string().min(1).max(20),
});

export const stepsConfigSchema = cardAppearanceSchema.extend({
  // Max 4: that's how many milestones the generated wallet cards actually
  // render (lib/wallet/heroImage.ts), so more would silently create stages
  // the customer's real card never shows. Mirrors MAX_STAGES in
  // components/dashboard/program-form.tsx.
  stages: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        threshold: z.number().int().min(0),
      })
    )
    .min(1)
    .max(4),
});

export const createProgramSchema = z.discriminatedUnion("type", [
  z.object({
    name: z.string().min(1).max(100),
    type: z.literal("stamp"),
    config: stampConfigSchema,
  }),
  z.object({
    name: z.string().min(1).max(100),
    type: z.literal("points"),
    config: pointsConfigSchema,
  }),
  z.object({
    name: z.string().min(1).max(100),
    type: z.literal("steps"),
    config: stepsConfigSchema,
  }),
]);

export const updateProgramSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.union([stampConfigSchema, pointsConfigSchema, stepsConfigSchema]).optional(),
  is_active: z.boolean().optional(),
});

export const enrollSchema = z.object({
  program_id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  // Which wallet button the join page actually showed the visitor (it only
  // ever shows one, based on client-side iOS detection) — lets the server
  // skip creating a live Google Wallet object for someone who only ever saw
  // the "Add to Apple Wallet" button, and vice versa. See lib/customers/queries.ts'
  // hasGoogle: previously every enrollment created a Google object
  // regardless of platform, so every customer showed the Google Wallet icon
  // in the dashboard even if they only ever installed the Apple pass.
  platform: z.enum(["apple", "google"]).optional(),
});

export const scanSchema = z.object({
  pass_id: z.string().uuid(),
  action: z.enum(["award", "redeem"]),
  amount: z.number().int().positive().optional(),
});

export const onboardingSchema = z.object({
  business_name: z.string().min(1).max(100),
  industry: z.string().min(1).max(100),
  brand_color_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  brand_color_secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logo_url: z.string().url().optional().nullable(),
});

export const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro"]),
});

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "staff"]),
});

export const updateMerchantSettingsSchema = z.object({
  business_name: z.string().min(1).max(100).optional(),
  industry: z.string().min(1).max(100).optional(),
  logo_url: z.string().url().optional().nullable(),
  brand_color_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  brand_color_secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  currency: z.union([z.string().length(3), z.null()]).optional(),
  average_order_value: z.union([z.number().min(0), z.null()]).optional(),
  locale_default: z.enum(["en", "ar"]).optional(),
  timezone: z.string().min(1).max(100).optional(),
  notification_prefs: z
    .object({
      reward_unlocked: z.boolean().optional(),
      birthday: z.boolean().optional(),
      expiring_reward: z.boolean().optional(),
      inactive_customer: z.boolean().optional(),
    })
    .optional(),
  email_prefs: z
    .object({
      marketing: z.boolean().optional(),
      product_updates: z.boolean().optional(),
    })
    .optional(),
});

const segmentDefinitionSchema = z
  .object({
    scope: z.enum(["all", "program", "inactive_days", "birthday_month", "progress_threshold", "customers"]),
    program_id: z.string().uuid().optional(),
    inactive_days: z.number().int().positive().optional(),
    min_progress_percent: z.number().min(0).max(100).optional(),
    customer_ids: z.array(z.string().uuid()).min(1).max(500).optional(),
  })
  .refine((data) => data.scope !== "customers" || (data.customer_ids?.length ?? 0) > 0, {
    message: "Select at least one customer",
    path: ["customer_ids"],
  });

export const createCampaignSchema = z
  .object({
    type: z.enum(["manual", "scheduled"]),
    title: z.string().min(1).max(100),
    message: z.string().min(1).max(500),
    segment: segmentDefinitionSchema,
    scheduled_for: z.string().datetime().optional(),
  })
  .refine((data) => data.type !== "scheduled" || data.scheduled_for !== undefined, {
    message: "scheduled_for is required for scheduled campaigns",
  });

// Geo-push radius is fixed at 150m for every location — not a per-merchant
// setting. radius_meters is deliberately absent from this schema (rather
// than a min/max range) so a merchant can never set their own value via the
// API: unrecognized fields are silently dropped by zod, and the insert in
// app/api/settings/locations/route.ts hardcodes 150 regardless of what's
// sent, matching the store_locations table's own default.
export const storeLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(300).optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  relevant_text: z.string().max(200).optional().nullable(),
  is_active: z.boolean().optional(),
  /** Programs this location applies to. Omitted/empty = applies to all. */
  program_ids: z.array(z.string().uuid()).optional(),
});

export const updateStoreLocationSchema = storeLocationSchema.partial();

export const updateStaffSchema = z
  .object({
    role: z.enum(["admin", "manager", "staff"]).optional(),
    status: z.enum(["active", "revoked"]).optional(),
  })
  .refine((data) => data.role !== undefined || data.status !== undefined, {
    message: "Provide at least one of role or status",
  });
