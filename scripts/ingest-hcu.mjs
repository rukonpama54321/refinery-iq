// Compatibility shim — use ingest-all.mjs instead (handles all policy docs).
// Usage: node scripts/ingest-hcu.mjs
//   is equivalent to: node scripts/ingest-all.mjs --file "HCU_Unit_Demo_Manual.pdf"
import { spawnSync } from "node:child_process";
const r = spawnSync("node", ["scripts/ingest-all.mjs", "--file", "HCU_Unit_Demo_Manual.pdf"],
  { stdio: "inherit", shell: true });
process.exit(r.status ?? 0);
