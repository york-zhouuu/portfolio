import fs from "node:fs";
import path from "node:path";

const serverDir = path.join(process.cwd(), ".next", "server");
const chunksDir = path.join(serverDir, "chunks");

if (!fs.existsSync(serverDir) || !fs.existsSync(chunksDir)) {
  process.exit(0);
}

for (const entry of fs.readdirSync(chunksDir)) {
  if (!entry.endsWith(".js")) continue;

  const source = path.join(chunksDir, entry);
  const target = path.join(serverDir, entry);

  // Next 15 occasionally emits require("./799.js") from webpack-runtime.js
  // while only materializing the chunk at .next/server/chunks/799.js.
  // Mirror the chunk at the runtime's expected path so preview servers stay stable.
  fs.copyFileSync(source, target);
}
