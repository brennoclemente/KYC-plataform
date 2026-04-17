// Prisma configuration file
// The datasource (DATABASE_URL) is defined in prisma/schema.prisma
// This file only sets the schema and migrations paths.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
