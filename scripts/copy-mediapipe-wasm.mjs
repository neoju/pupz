import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sourceFile = require.resolve(
  "@mediapipe/tasks-vision/vision_wasm_internal.js",
);
const sourceDirectory = path.dirname(sourceFile);
const destinationDirectory = path.resolve("public/wasm");

fs.mkdirSync(destinationDirectory, { recursive: true });

for (const fileName of fs.readdirSync(sourceDirectory)) {
  fs.copyFileSync(
    path.join(sourceDirectory, fileName),
    path.join(destinationDirectory, fileName),
  );
}

console.log("MediaPipe WASM assets prepared.");
