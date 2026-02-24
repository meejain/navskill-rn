#!/usr/bin/env node

/*
 * compare-structural-schema.js
 *
 * Compares source phase-1/2/3 JSON against
 * migrated-structural-summary.json.
 * Produces schema-register.json with per-component
 * validation status.
 *
 * Usage:
 *   node scripts/compare-structural-schema.js
 *     <phase1> <phase2> <phase3> <migrated-summary>
 *     [--threshold=95] [--output-register=<path>]
 *
 * Exit codes:
 *   0 = structural similarity >= threshold
 *   1 = similarity < threshold or mismatches found
 *   2 = usage error
 */

import fs from 'fs';
import path from 'path';

function normalizeElementName(name) {
  return name
    .replace(/^(banner|nav|header)-/, '')
    .toLowerCase();
}

function debugLog(level, msg) {
  const ts = new Date().toISOString();
  const prefix = {
    ERROR: '❌',
    PASS: '✅',
    BLOCK: '🚫',
    START: '🔵',
    END: '🏁',
  }[level] || 'ℹ️';
  const tag = '[SCRIPT:compare-structural-schema]';
  const entry = `[${ts}] ${prefix} ${tag} [${level}] ${msg}\n`;
  try {
    const logDir = path.resolve(
      'blocks/header/navigation-validation',
    );
    if (fs.existsSync(logDir)) {
      fs.appendFileSync(
        path.join(logDir, 'debug.log'),
        entry,
      );
    }
  } catch (_) { /* ignore */ }
}

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(
      `Failed to load ${filePath}: ${e.message}`,
    );
    return null;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let threshold = 95;
  let outputPath = null;
  const positional = [];

  args.forEach((arg) => {
    if (arg.startsWith('--threshold=')) {
      const [, val] = arg.split('=');
      threshold = parseInt(val, 10);
    } else if (arg.startsWith('--output-register=')) {
      const [, val] = arg.split('=');
      outputPath = val;
    } else if (arg.startsWith('--output=')) {
      const [, val] = arg.split('=');
      outputPath = val;
    } else {
      positional.push(arg);
    }
  });

  return { threshold, outputPath, positional };
}

function addRowComponents(components, srcRow, migRow, i) {
  // Row hasImages
  const srcHasImages = srcRow.hasImages ?? false;
  const migHasImages = migRow.hasImages ?? false;
  components.push({
    id: `row-${i}-images`,
    label: `Row ${i} images`,
    source: srcHasImages,
    migrated: migHasImages,
    matches: srcHasImages === migHasImages,
    status: srcHasImages === migHasImages
      ? 'validated' : 'pending',
    delta: srcHasImages !== migHasImages
      ? `Source row ${i} hasImages=${srcHasImages},`
        + ` migrated=${migHasImages}`
      : null,
  });

  // Row elements count and types
  const srcElements = srcRow.alignmentGroups
    ? srcRow.alignmentGroups.flatMap(
      (g) => g.elements || [],
    )
    : [];
  const migElements = migRow.alignmentGroups
    ? migRow.alignmentGroups.flatMap(
      (g) => g.elements || [],
    )
    : (migRow.elements || []);

  const srcElementTypes = srcElements
    .map((e) => (typeof e === 'string'
      ? e : (e.type || 'unknown')))
    .sort();
  const migElementNames = (
    Array.isArray(migElements) ? migElements : []
  )
    .map((e) => (typeof e === 'string'
      ? e : (e.type || 'unknown')))
    .sort();

  const srcNormalized = new Set(
    srcElementTypes.map(normalizeElementName),
  );
  const migNormalized = new Set(
    migElementNames.map(normalizeElementName),
  );
  const allNormalized = new Set(
    [...srcNormalized, ...migNormalized],
  );
  const matchCount = [...allNormalized].filter(
    (e) => srcNormalized.has(e)
      && migNormalized.has(e),
  ).length;
  const elemMatch = allNormalized.size === 0
    || matchCount / allNormalized.size >= 0.6;

  components.push({
    id: `row-${i}-elements`,
    label: `Row ${i} elements`,
    source: srcElementTypes.join(', ') || 'none',
    migrated: migElementNames.join(', ') || 'none',
    matches: elemMatch,
    status: elemMatch ? 'validated' : 'pending',
    delta: !elemMatch
      ? 'Element types differ:'
        + ` source=[${srcElementTypes}],`
        + ` migrated=[${migElementNames}]`
      : null,
  });

  // Row alignment groups
  const srcGroups = (srcRow.alignmentGroups || [])
    .map((g) => g.position).sort();
  const migGroups = (migRow.alignmentGroups || [])
    .map((g) => g.position).sort();
  const groupsMatch = JSON.stringify(srcGroups)
    === JSON.stringify(migGroups);
  components.push({
    id: `row-${i}-alignment`,
    label: `Row ${i} alignment groups`,
    source: srcGroups.join(', ') || 'none',
    migrated: migGroups.join(', ') || 'none',
    matches: groupsMatch,
    status: groupsMatch ? 'validated' : 'pending',
    delta: !groupsMatch
      ? 'Alignment groups differ:'
        + ` source=[${srcGroups}],`
        + ` migrated=[${migGroups}]`
      : null,
  });
}

function addMegamenuComponents(components, p2, p3, mega) {
  // Navigation pattern type
  const sourceType = p3.animationType
    || (p2.offCanvasNavigation
      ? p2.offCanvasNavigation.type : 'unknown');
  const migratedType = mega.type || 'unknown';
  const typeNormSrc = sourceType
    .toLowerCase().replace(/[_\s-]+/g, '-');
  const typeNormMig = migratedType
    .toLowerCase().replace(/[_\s-]+/g, '-');
  const isSlideIn = typeNormSrc.includes('slide-in')
    && typeNormMig.includes('slide-in');
  const isOffCanvas = typeNormSrc.includes('off-canvas')
    && typeNormMig.includes('off-canvas');
  const typeMatch = isSlideIn
    || isOffCanvas
    || typeNormSrc === typeNormMig;
  components.push({
    id: 'megamenu-type',
    label: 'Navigation pattern type',
    source: sourceType,
    migrated: migratedType,
    matches: typeMatch,
    status: typeMatch ? 'validated' : 'pending',
    delta: !typeMatch
      ? 'Pattern type differs:'
        + ` source="${sourceType}",`
        + ` migrated="${migratedType}"`
      : null,
  });

  // Column count
  const srcCols = p3.columnCount ?? 0;
  const migCols = mega.columnCount ?? 0;
  components.push({
    id: 'megamenu-columns',
    label: 'Megamenu column count',
    source: srcCols,
    migrated: migCols,
    matches: srcCols === migCols,
    status: srcCols === migCols
      ? 'validated' : 'pending',
    delta: srcCols !== migCols
      ? 'Column count differs:'
        + ` source=${srcCols}, migrated=${migCols}`
      : null,
  });

  // Megamenu hasImages
  const srcMegaImages = p3.hasImages ?? false;
  const migMegaImages = mega.hasImages ?? false;
  components.push({
    id: 'megamenu-images',
    label: 'Megamenu images',
    source: srcMegaImages,
    migrated: migMegaImages,
    matches: srcMegaImages === migMegaImages,
    status: srcMegaImages === migMegaImages
      ? 'validated' : 'pending',
    delta: srcMegaImages !== migMegaImages
      ? 'hasImages differs:'
        + ` source=${srcMegaImages},`
        + ` migrated=${migMegaImages}`
      : null,
  });

  // Nested levels
  const srcNested = p3.nestedLevels ?? 0;
  const migNested = mega.nestedLevels ?? 0;
  const nestedMatch = srcNested === migNested
    || Math.abs(srcNested - migNested) <= 1;
  components.push({
    id: 'megamenu-nesting',
    label: 'Nesting levels',
    source: srcNested,
    migrated: migNested,
    matches: nestedMatch,
    status: nestedMatch ? 'validated' : 'pending',
    delta: !nestedMatch
      ? 'Nesting levels differ:'
        + ` source=${srcNested},`
        + ` migrated=${migNested}`
      : null,
  });

  // Nav items count
  const srcNavItems = p2.offCanvasNavigation
    ?.items?.length ?? 0;
  const migNavItems = mega.navItems ?? 0;
  const navItemsMatch = srcNavItems === migNavItems
    || Math.abs(srcNavItems - migNavItems) <= 1;
  components.push({
    id: 'megamenu-nav-items',
    label: 'Nav item count',
    source: srcNavItems,
    migrated: migNavItems,
    matches: navItemsMatch,
    status: navItemsMatch ? 'validated' : 'pending',
    delta: !navItemsMatch
      ? 'Nav items count differs:'
        + ` source=${srcNavItems},`
        + ` migrated=${migNavItems}`
      : null,
  });

  // CTA buttons
  const srcHasCta = p3.promotionalBlocks
    && p3.promotionalBlocks.length > 0;
  const migHasCta = mega.hasCtaButtons ?? false;
  const ctaMatch = !!srcHasCta === !!migHasCta;
  components.push({
    id: 'megamenu-cta',
    label: 'CTA buttons',
    source: !!srcHasCta,
    migrated: !!migHasCta,
    matches: ctaMatch,
    status: ctaMatch ? 'validated' : 'pending',
    delta: !ctaMatch
      ? 'CTA buttons differ:'
        + ` source=${!!srcHasCta},`
        + ` migrated=${!!migHasCta}`
      : null,
  });

  // Overlay behavior
  const srcOverlay = p3.overlayBehavior?.hasOverlay
    ?? false;
  const migOverlayColor = mega.overlayColor;
  const migHasOverlay = !!migOverlayColor
    || (mega.overlayBehavior?.hasOverlay ?? false);
  const overlayMatch = srcOverlay === migHasOverlay;
  components.push({
    id: 'megamenu-overlay',
    label: 'Overlay behavior',
    source: srcOverlay,
    migrated: migHasOverlay,
    matches: overlayMatch,
    status: overlayMatch ? 'validated' : 'pending',
    delta: !overlayMatch
      ? 'Overlay differs:'
        + ` source hasOverlay=${srcOverlay},`
        + ` migrated=${migHasOverlay}`
      : null,
  });
}

function main() {
  const { threshold, outputPath, positional } = parseArgs();

  if (positional.length < 4) {
    console.error(
      'Usage: node compare-structural-schema.js'
      + ' <phase1> <phase2> <phase3> <migrated>'
      + ' [--threshold=95] [--output-register=<path>]',
    );
    process.exit(2);
  }

  const [p1Path, p2Path, p3Path, migratedPath] = positional;

  [p1Path, p2Path, p3Path, migratedPath].forEach((fp) => {
    if (!fs.existsSync(fp)) {
      console.error(`File not found: ${fp}`);
      process.exit(2);
    }
  });

  const p1 = loadJson(p1Path);
  const p2 = loadJson(p2Path);
  const p3 = loadJson(p3Path);
  const migrated = loadJson(migratedPath);

  if (!p1 || !p2 || !p3 || !migrated) {
    console.error('Failed to load one or more JSON files.');
    process.exit(2);
  }

  debugLog(
    'START',
    'compare-structural-schema.js invoked'
    + ` — p1=${p1Path}, p2=${p2Path},`
    + ` p3=${p3Path}, migrated=${migratedPath},`
    + ` threshold=${threshold}`,
  );

  const components = [];

  // --- Component: Row Count ---
  const sourceRowCount = p1.rowCount
    ?? (p2.rows ? p2.rows.length : 0);
  const migratedRowCount = migrated.rowCount
    ?? (migrated.rows ? migrated.rows.length : 0);
  components.push({
    id: 'row-count',
    label: 'Row count',
    source: sourceRowCount,
    migrated: migratedRowCount,
    matches: sourceRowCount === migratedRowCount,
    status: sourceRowCount === migratedRowCount
      ? 'validated' : 'pending',
    delta: sourceRowCount !== migratedRowCount
      ? `Source has ${sourceRowCount} row(s),`
        + ` migrated has ${migratedRowCount}`
      : null,
  });

  // --- Per-row components ---
  const sourceRows = p2.rows || [];
  const migratedRows = migrated.rows || [];
  const rowCount = Math.max(
    sourceRows.length,
    migratedRows.length,
  );

  for (let i = 0; i < rowCount; i += 1) {
    const srcRow = sourceRows[i];
    const migRow = migratedRows[i];

    if (!srcRow && migRow) {
      components.push({
        id: `row-${i}`,
        label: `Row ${i}`,
        source: 'missing',
        migrated: 'present',
        matches: false,
        status: 'pending',
        delta: `Row ${i} in migrated but not source`,
      });
    } else if (srcRow && !migRow) {
      components.push({
        id: `row-${i}`,
        label: `Row ${i}`,
        source: 'present',
        migrated: 'missing',
        matches: false,
        status: 'pending',
        delta: `Row ${i} in source but not migrated`,
      });
    } else {
      addRowComponents(components, srcRow, migRow, i);
    }
  }

  // --- Megamenu / Off-canvas navigation ---
  const migratedMega = migrated.megamenu || {};
  addMegamenuComponents(components, p2, p3, migratedMega);

  // --- Calculate similarity ---
  const totalComponents = components.length;
  const validatedCount = components.filter(
    (comp) => comp.status === 'validated',
  ).length;
  const pendingCount = components.filter(
    (comp) => comp.status === 'pending',
  ).length;
  const similarity = totalComponents > 0
    ? Math.round(
      (validatedCount / totalComponents) * 100,
    )
    : 0;

  const register = {
    components,
    summary: {
      totalComponents,
      validated: validatedCount,
      pending: pendingCount,
      similarity,
      threshold,
      passes: similarity >= threshold,
    },
    allValidated: pendingCount === 0
      && totalComponents > 0,
  };

  // --- Output ---
  console.log('=== Structural Schema Comparison ===');
  console.log(
    `Source: phase-1 (${p1Path}),`
    + ` phase-2 (${p2Path}), phase-3 (${p3Path})`,
  );
  console.log(`Migrated: ${migratedPath}`);
  console.log(`Total components: ${totalComponents}`);
  console.log(
    `  Validated: ${validatedCount}/${totalComponents}`,
  );
  console.log(
    `  Pending:   ${pendingCount}/${totalComponents}`,
  );
  console.log(
    `  Similarity: ${similarity}%`
    + ` (threshold: ${threshold}%)`,
  );

  if (pendingCount > 0) {
    console.log('\n=== MISMATCHES ===');
    components
      .filter((comp) => comp.status === 'pending')
      .forEach((comp) => {
        console.log(
          `  [${comp.id}] "${comp.label}":`
          + ` ${comp.delta || 'mismatch'}`,
        );
      });
  }

  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      outputPath,
      JSON.stringify(register, null, 2),
    );
    console.log(`\nRegister written to: ${outputPath}`);
  } else {
    console.log(
      `\n${JSON.stringify(register, null, 2)}`,
    );
  }

  const passed = similarity >= threshold;
  console.log(
    `\n=== ${passed ? 'PASSED' : 'FAILED'}`
    + ` (${similarity}% >= ${threshold}%`
    + ` threshold: ${passed}) ===`,
  );

  if (passed) {
    debugLog(
      'PASS',
      `PASSED — similarity=${similarity}%`
      + ` (threshold=${threshold}%),`
      + ` ${validatedCount}/${totalComponents}`
      + ' components validated',
    );
  } else {
    const failedIds = components
      .filter((comp) => comp.status === 'pending')
      .map((comp) => comp.id)
      .join(', ');
    debugLog(
      'BLOCK',
      `FAILED — similarity=${similarity}%`
      + ` (threshold=${threshold}%),`
      + ` pending: ${failedIds}`,
    );
  }

  process.exit(passed ? 0 : 1);
}

main();
