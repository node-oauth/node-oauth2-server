const { promises: fs } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const glob = require('glob');

(async function () {
  // Usage:
  //   node scripts/build-docs-cli.js [srcRoot] [outRoot]
  // Examples:
  //   node scripts/build-docs-cli.js               -> src: "src", out: "docs"
  //   node scripts/build-docs-cli.js lib           -> src: "lib", out: "docs"
  //   node scripts/build-docs-cli.js lib build/docs -> src: "lib", out: "build/docs"

  const srcRoot = process.argv[2] || 'lib/';
  const outRoot = process.argv[3] || 'docs/api/';
  const pattern = `${srcRoot.replace(/\\/g, '/')}/**/*.js`;
  const files = glob.sync(pattern, { nodir: true });

  if (files.length === 0) {
    console.error(`No files found for pattern: ${pattern}`);
    process.exit(1);
  }

  for (const src of files) {
    const rel = path.relative(srcRoot, src);
    const outPath = path.join(outRoot, rel).replace(/\.(js|ts)$/, '.md');

    await fs.mkdir(path.dirname(outPath), { recursive: true });

    try {
      const md = execFileSync(
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        ['jsdoc-to-markdown', src],
        { encoding: 'utf8' }
      );
      await fs.writeFile(outPath, md, 'utf8');
      console.log('Wrote', outPath);
    } catch (err) {
      console.error('Failed:', src, err.message);
    }
  }
})();