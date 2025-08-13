import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.join(__dirname, "sample.pdf");

console.log("Looking for file:", pdfPath);

if (!fs.existsSync(pdfPath)) {
  console.error("❌ sample.pdf is missing!");
  process.exit(1);
}

console.log("✅ File found! Size:", fs.statSync(pdfPath).size, "bytes");
