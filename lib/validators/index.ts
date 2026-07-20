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
