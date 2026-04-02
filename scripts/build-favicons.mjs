import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

async function rasterizeSvg(svgPath, size) {
  const input = await readFile(svgPath);
  return sharp(input).resize(size, size).png().toBuffer();
}

async function writePng(svgPath, outName, size = 32) {
  const buf = await rasterizeSvg(svgPath, size);
  await writeFile(join(publicDir, outName), buf);
}

async function writeIco(svgPath, outName) {
  const buffers = await Promise.all([16, 32, 48].map((s) => rasterizeSvg(svgPath, s)));
  const ico = await toIco(buffers);
  await writeFile(join(publicDir, outName), ico);
}

const lightSvg = join(publicDir, "favicon-light.svg");
const darkSvg = join(publicDir, "favicon-dark.svg");

await writePng(lightSvg, "favicon-light.png");
await writePng(darkSvg, "favicon-dark.png");
await writeIco(lightSvg, "favicon-light.ico");
await writeIco(darkSvg, "favicon-dark.ico");
await writeIco(lightSvg, "favicon.ico");

console.log("Wrote favicon PNG/ICO assets in public/");
