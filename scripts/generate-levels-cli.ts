import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  generateCampaign,
  generateCampaignLevelDebug,
  renderCampaignReport,
  renderGeneratedCampaignModule
} from "../src/game/campaign-generator";

const repoRoot = process.cwd();
const debugFlagIndex = process.argv.indexOf("--debug-index");
const debugIndex =
  debugFlagIndex >= 0 ? Number.parseInt(process.argv[debugFlagIndex + 1] ?? "", 10) : null;
const requestedCount = Number.parseInt(process.argv[2] ?? "20", 10);

if (debugIndex !== null) {
  if (!Number.isInteger(debugIndex) || debugIndex < 1) {
    throw new Error("Usage: npm run generate:levels -- --debug-index <1-based-index>");
  }

  const debug = generateCampaignLevelDebug(debugIndex - 1);
  console.log(JSON.stringify(debug.reportRow, null, 2));
  process.exit(0);
}

if (!Number.isInteger(requestedCount) || requestedCount <= 0) {
  throw new Error("Usage: npm run generate:levels -- <count>");
}

const campaign = generateCampaign(requestedCount, (progress) => {
  console.log(
    `[${progress.index}/${progress.count}] ${progress.name} (${progress.key}) difficulty ${progress.difficulty.toFixed(2)}`
  );
});
const generatedModulePath = resolve(repoRoot, "src/game/generated-campaign.ts");
const reportPath = resolve(repoRoot, "docs/generated-campaign-report.md");

mkdirSync(dirname(generatedModulePath), { recursive: true });
mkdirSync(dirname(reportPath), { recursive: true });

writeFileSync(generatedModulePath, renderGeneratedCampaignModule(campaign));
writeFileSync(reportPath, renderCampaignReport(campaign.reportRows));

console.log(`Generated ${campaign.levels.length} campaign levels.`);
console.log(`Wrote ${generatedModulePath}`);
console.log(`Wrote ${reportPath}`);
