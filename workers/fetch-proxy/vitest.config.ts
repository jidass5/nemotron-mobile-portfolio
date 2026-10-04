import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { defineConfig } from "vitest/config";

export default defineWorkersConfig(
  defineConfig({
    test: {
      include: ["test/**/*.test.ts"],
      pool: "@cloudflare/vitest-pool-workers",
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.jsonc" },
        },
      },
    },
  }),
);
