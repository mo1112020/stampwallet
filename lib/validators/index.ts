import { z } from "zod";

const cardAppearanceSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_image_url: z.string().url().optional(),
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
});

export const stampConfigSchema = cardAppearanceSchema.extend({
  stamps_required: z.number().int().min(1).max(25),
  reward_description: z.string().min(1).max(200),
  icon: z.string().min(1).max(16),
});

export const pointsConfigSchema = cardAppearanceSchema.extend({
  points_per_reward: z.number().int().min(1),
  reward_description: z.string().min(1).max(200),
  points_label: z.string().min(1).max(20),
});

export const stepsConfigSchema = cardAppearanceSchema.extend({
  stages: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        threshold: z.number().int().min(0),
      })
    )
    .min(1),
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
});

const segmentDefinitionSchema = z.object({
  scope: z.enum(["all", "program", "inactive_days", "birthday_month", "progress_threshold"]),
  program_id: z.string().uuid().optional(),
  inactive_days: z.number().int().positive().optional(),
  min_progress_percent: z.number().min(0).max(100).optional(),
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

export const storeLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(300).optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_meters: z.number().int().min(20).max(5000).default(150),
  relevant_text: z.string().max(200).optional().nullable(),
  is_active: z.boolean().optional(),
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
