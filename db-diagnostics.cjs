const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const BASE_URL = process.argv[2];

if (!BASE_URL) {
  console.log('Usage:');
  console.log('node performance-audit.cjs https://your-site.com');
  process.exit(1);
}

const root = process.cwd();

function walk(dir) {
  let results = [];

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const full = path.join(dir, file);

      if (
        file === 'node_modules' ||
        file === '.git' ||
        file === '.next' ||
        file === 'dist' ||
        file === 'build'
      )
        continue;

      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        results = results.concat(walk(full));
      } else {
        results.push(full);
      }
    }
  } catch {}

  return results;
}

const allFiles = walk(root);

const report = {
  routes: [],
  dbConnectCalls: [],
  queriesWithoutLean: [],
  populates: [],
  aggregates: [],
  fetchCalls: [],
  awaitLoops: [],
};

console.log('\n═══════════════════════════════════════');
console.log('NEXT.JS PERFORMANCE AUDIT');
console.log('═══════════════════════════════════════');

for (const file of allFiles) {
  if (!/\.(js|jsx|ts|tsx|cjs|mjs)$/.test(file)) continue;

  let content;

  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const rel = path.relative(root, file);

  if (rel.includes('app/api') && rel.includes('route.')) {
    report.routes.push(rel);
  }

  const connectMatches = content.match(/dbConnect\s*\(/g) || [];

  if (connectMatches.length) {
    report.dbConnectCalls.push({
      file: rel,
      count: connectMatches.length,
    });
  }

  const findMatches = content.match(/\.find\s*\(/g) || [];

  const leanMatches = content.match(/\.lean\s*\(/g) || [];

  if (findMatches.length && leanMatches.length < findMatches.length) {
    report.queriesWithoutLean.push({
      file: rel,
      finds: findMatches.length,
      leans: leanMatches.length,
    });
  }

  const populateMatches = content.match(/\.populate\s*\(/g) || [];

  if (populateMatches.length) {
    report.populates.push({
      file: rel,
      count: populateMatches.length,
    });
  }

  const aggregateMatches = content.match(/\.aggregate\s*\(/g) || [];

  if (aggregateMatches.length) {
    report.aggregates.push({
      file: rel,
      count: aggregateMatches.length,
    });
  }

  const fetchMatches = content.match(/fetch\s*\(/g) || [];

  if (fetchMatches.length) {
    report.fetchCalls.push({
      file: rel,
      count: fetchMatches.length,
    });
  }

  const awaitLoop = /for[\s\S]{0,500}?await/g.test(content);

  if (awaitLoop) {
    report.awaitLoops.push(rel);
  }
}

console.log('\nAPI ROUTES');
console.log('────────────────────────');

report.routes.forEach((r) => console.log(r));

console.log('\nDB CONNECT USAGE');
console.log('────────────────────────');

report.dbConnectCalls.forEach((x) => console.log(`${x.file} → ${x.count}`));

console.log('\nFIND WITHOUT LEAN');
console.log('────────────────────────');

report.queriesWithoutLean.forEach((x) =>
  console.log(`${x.file} → find:${x.finds} lean:${x.leans}`)
);

console.log('\nPOPULATE');
console.log('────────────────────────');

report.populates.forEach((x) => console.log(`${x.file} → ${x.count}`));

console.log('\nAGGREGATIONS');
console.log('────────────────────────');

report.aggregates.forEach((x) => console.log(`${x.file} → ${x.count}`));

console.log('\nFETCH CALLS');
console.log('────────────────────────');

report.fetchCalls
  .sort((a, b) => b.count - a.count)
  .forEach((x) => console.log(`${x.file} → ${x.count}`));

console.log('\nAWAIT INSIDE LOOPS');
console.log('────────────────────────');

report.awaitLoops.forEach((x) => console.log(x));

async function benchmark(url) {
  const start = performance.now();

  const res = await fetch(url);

  const text = await res.text();

  const end = performance.now();

  return {
    status: res.status,
    size: Buffer.byteLength(text),
    time: Math.round(end - start),
  };
}

(async () => {
  console.log('\nENDPOINT BENCHMARK');
  console.log('────────────────────────');

  for (const route of report.routes) {
    const apiPath = route.replace(/^app/, '').replace(/\/route\.(ts|js|tsx|jsx)$/, '');

    const url = BASE_URL + apiPath;

    try {
      const first = await benchmark(url);
      const second = await benchmark(url);

      const cold = first.time - second.time;

      console.log(`
${apiPath}
  first  : ${first.time}ms
  second : ${second.time}ms
  delta  : ${cold}ms
  size   : ${first.size} bytes
  status : ${first.status}
`);
    } catch (err) {
      console.log(`${apiPath} → FAILED`);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('AUDIT COMPLETE');
  console.log('═══════════════════════════════════════');
})();
