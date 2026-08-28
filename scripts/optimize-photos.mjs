/* ─────────────────────────────────────────────────────────────
   Resize the product photography to what the page actually needs.

   Every photo on the page renders at a known width, so the useful
   size is that width at 2x and no more. The six that sit in
   two-column grids never render past ~540 CSS pixels; only the
   three full-width shots need real resolution.

   Run after dropping new masters into public/photos:
     node scripts/optimize-photos.mjs           # report only
     node scripts/optimize-photos.mjs --write   # resize in place
   ───────────────────────────────────────────────────────────── */
import sharp from "sharp";
import { readdir, stat, rename, unlink } from "node:fs/promises";
import { join } from "node:path";

const DIR = "public/photos";
const WRITE = process.argv.includes("--write");
const QUALITY = 82;

/* Longest edge, in pixels, at 2x the size the layout renders it. */
const TARGET = {
  "hero-jar-and-box": 2880, // full-bleed band above 1024px
  "woman-by-window": 2880, // full-bleed film slot
  "ingredients-flat-lay": 2160, // 1080px centrepiece
  "jar-open-top-down": 1120, // half of a 1080px grid
  "jar-open-with-scoop": 1120,
  "hands-scooping": 1120,
  "bedside-table": 1120,
  "three-jars": 960, // 460px column in the waitlist band
  unboxing: 960,
};

const kb = (n) => `${Math.round(n / 1024)}KB`;

const files = (await readdir(DIR)).filter((f) => /\.jpe?g$/i.test(f));
let saved = 0;

for (const file of files.sort()) {
  const path = join(DIR, file);
  const name = file.replace(/\.jpe?g$/i, "");
  const target = TARGET[name];
  if (!target) {
    console.log(`skip  ${file} — no target (unknown slot)`);
    continue;
  }

  const before = (await stat(path)).size;
  const meta = await sharp(path).metadata();
  const longest = Math.max(meta.width, meta.height);

  if (longest <= target) {
    console.log(`keep  ${file}  ${meta.width}x${meta.height}  ${kb(before)} — already at or under ${target}px`);
    continue;
  }

  const tmp = path + ".tmp";
  await sharp(path)
    .resize({
      width: meta.width >= meta.height ? target : null,
      height: meta.height > meta.width ? target : null,
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(tmp);

  const after = (await stat(tmp)).size;
  const out = await sharp(tmp).metadata();

  if (WRITE) {
    await rename(tmp, path);
  } else {
    await unlink(tmp);
  }
  saved += before - after;
  console.log(
    `${WRITE ? "wrote" : "would"} ${file}  ${meta.width}x${meta.height} ${kb(before)}  →  ${out.width}x${out.height} ${kb(after)}`,
  );
}

console.log(`\n${WRITE ? "saved" : "would save"} ${kb(saved)} across ${files.length} files`);
if (!WRITE) console.log("re-run with --write to apply");
