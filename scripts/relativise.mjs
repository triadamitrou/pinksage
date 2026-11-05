/**
 * Make ./out open from a folder, with no web server.
 *
 * `next build` with output: export writes absolute paths - /_next/...,
 * /shop/flowers/ - which a browser resolves against the filesystem root
 * when the page is opened as a file. The export is then a folder of
 * blank pages, which is exactly what somebody double-clicking it finds.
 *
 * This walks every exported .html file, works out how deep it sits, and
 * rewrites each absolute path to a relative one. Directory links get
 * index.html appended, because file:// has no directory index.
 *
 *   node scripts/relativise.mjs out
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.argv[2] ?? "out";

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".html")) fix(full);
  }
}

function fix(file) {
  // How many folders down from the export root this page sits.
  const depth = relative(root, file).split(sep).length - 1;
  const up = depth === 0 ? "./" : "../".repeat(depth);

  let html = readFileSync(file, "utf8");

  // href="/shop/flowers/?sub=roses"
  //   -> href="../shop/flowers/index.html?sub=roses"
  // The query and the hash are kept but never rewritten, and a trailing
  // slash gains an index.html because file:// has no directory index.
  html = html.replace(/((?:href|src)=")\/([^"]*)"/g, (whole, lead, rest) => {
    if (rest.startsWith("/")) return whole; // protocol-relative, leave it
    const cut = rest.search(/[?#]/);
    const path = cut === -1 ? rest : rest.slice(0, cut);
    const tail = cut === -1 ? "" : rest.slice(cut);
    const target =
      path === "" ? "index.html" : path.endsWith("/") ? `${path}index.html` : path;
    return `${lead}${up}${target}${tail}"`;
  });

  // srcset, and the absolute paths Next embeds in its inline bootstrap.
  html = html.replace(/(srcset=")([^"]*)"/g, (_, lead, set) =>
    `${lead}${set.replace(/(^|,\s*)\/(?!\/)/g, `$1${up}`)}"`,
  );
  html = html.replace(/"\/_next\//g, `"${up}_next/`);
  html = html.replace(/\\"\/_next\//g, `\\"${up}_next/`);

  writeFileSync(file, html);
}

walk(root);
console.log(`Rewrote every absolute path in ${root} to a relative one.`);
