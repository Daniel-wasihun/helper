import type { FullConfig } from "@playwright/test";

export default async function globalTeardown(config: FullConfig) {
  console.log("\n[Playwright Global Teardown] Finishing test suite run...");
  // Place any post-suite database cleanup, snapshot generation, or metric logging here
  console.log("[Playwright Global Teardown] ✓ Test suite execution finished.\n");
}
