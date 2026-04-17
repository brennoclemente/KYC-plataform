-- Add new fields to theme_configs table
ALTER TABLE "theme_configs" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;
ALTER TABLE "theme_configs" ADD COLUMN IF NOT EXISTS "heroTitle" TEXT;
ALTER TABLE "theme_configs" ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT;
ALTER TABLE "theme_configs" ADD COLUMN IF NOT EXISTS "heroCtaText" TEXT;
