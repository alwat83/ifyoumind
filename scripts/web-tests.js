// Runs every fast test in test/ (anything not named *.integration.test.mjs, which needs emulators).
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "test");
const files = fs.readdirSync(dir)
  .filter(name => name.endsWith(".test.mjs") && !name.endsWith(".integration.test.mjs") && !name.includes(".rules."))
  .sort()
  .map(name => path.join("test", name));
const result = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit", cwd: path.join(__dirname, "..") });
process.exit(result.status ?? 1);
