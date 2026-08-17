import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
  datasource: {
    // Keep Prisma CLI commands such as `prisma generate` working even when
    // .env has not been created yet. Runtime/database commands still use the
    // real DATABASE_URL when it is provided.
    url:
      process.env.DATABASE_URL ??
      "postgresql://crm:crm_password@localhost:5432/medical_crm?schema=public",
  },
});
