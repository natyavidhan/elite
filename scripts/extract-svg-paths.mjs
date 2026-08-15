import fs from 'node:fs';

function bboxCoverage(d, viewW, viewH) {
  const nums = (d.match(/-?\d+\.?\d*/g) || []).map(Number);
  if (nums.length < 4) return 0;
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  return (w * h) / (viewW * viewH);
}

function extract(svgPath, outPath, exportName) {
  const content = fs.readFileSync(svgPath, 'utf-8');
  const viewBoxMatch = content.match(/viewBox="([\d.\s]+)"/);
  const viewBox = viewBoxMatch[1];
  const [, , viewW, viewH] = viewBox.split(/\s+/).map(Number);

  const groupRe = /<g id="([a-z]+)">([\s\S]*?)<\/g>/g;
  const labeled = {};
  let groupSpans = [];
  let m;
  while ((m = groupRe.exec(content))) {
    const [full, id, inner] = m;
    const pathRe = /<path[^>]*\sd="([^"]+)"[^>]*\/>/g;
    const ds = [];
    let pm;
    while ((pm = pathRe.exec(inner))) ds.push(pm[1]);
    labeled[id] = ds;
    groupSpans.push([m.index, m.index + full.length]);
  }

  // Remove labeled group blocks, then collect remaining top-level paths as unlabeled/decorative.
  let stripped = '';
  let cursor = 0;
  for (const [start, end] of groupSpans) {
    stripped += content.slice(cursor, start);
    cursor = end;
  }
  stripped += content.slice(cursor);

  // Unlabeled top-level paths come in two real kinds, not one:
  //  - filled shading/shadow accents (an explicit fill attribute) — drawn as
  //    a faint ink wash beneath the muscle groups.
  //  - the actual line-art contour of the figure: stroke="black", NO fill
  //    attribute (relying on the root <svg>'s fill="none"). These are the
  //    outlines that hold the whole plate together (head, torso, limbs) and
  //    must render as strokes, not be dropped or filled.
  const unlabeledFill = [];
  const unlabeledStroke = [];
  let droppedBackground = 0;
  const topPathRe = /<path\b([^>]*)\/>/g;
  let um;
  while ((um = topPathRe.exec(stripped))) {
    const attrs = um[1];
    const dMatch = attrs.match(/\sd="([^"]+)"/);
    if (!dMatch) continue;
    const d = dMatch[1];
    const fillMatch = attrs.match(/\sfill="([^"]+)"/);
    const fill = fillMatch ? fillMatch[1] : null;

    if (!fill) {
      unlabeledStroke.push(d);
      continue;
    }
    // Each file also carries one near-full-canvas silhouette path, fill
    // #E0E0E0, sitting behind the anatomical linework (which is #BDBDBD) —
    // not a muscle group, and at any opacity its sheer area reads as an
    // unwanted wash. Drop only that specific color+size combination;
    // smaller #E0E0E0 shadow accents (under the arms, at the ankles) stay.
    if (fill === '#E0E0E0' && bboxCoverage(d, viewW, viewH) > 0.5) {
      droppedBackground++;
      continue;
    }
    unlabeledFill.push(d);
  }

  const labeledCount = Object.values(labeled).reduce((n, arr) => n + arr.length, 0);
  console.log(
    `${svgPath}: viewBox=${viewBox} labeled groups=${Object.keys(labeled).length} (${labeledCount} paths) unlabeledFill=${unlabeledFill.length} unlabeledStroke=${unlabeledStroke.length} (dropped ${droppedBackground} background path(s))`,
  );

  const ts = `// Auto-extracted from "${svgPath}". Do not hand-edit — regenerate via
// scripts/extract-svg-paths.mjs if the source SVG changes.

export const ${exportName}_VIEW_BOX = '${viewBox}';

export const ${exportName}_LABELED: Record<string, string[]> = ${JSON.stringify(labeled, null, 2)};

export const ${exportName}_UNLABELED_FILL: string[] = ${JSON.stringify(unlabeledFill, null, 2)};

export const ${exportName}_UNLABELED_STROKE: string[] = ${JSON.stringify(unlabeledStroke, null, 2)};
`;
  fs.writeFileSync(outPath, ts);
}

extract('Muscular System.svg', 'src/constants/svgFrontPaths.ts', 'FRONT');
extract('Muscular System backside.svg', 'src/constants/svgBackPaths.ts', 'BACK');
