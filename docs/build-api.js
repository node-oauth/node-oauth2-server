const { promises: fs } = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const glob = require('glob');

(async function () {
    const srcRoot = 'src';
    // allow optional output folder as first CLI arg: node scripts/build-docs-cli.js build/docs
    const outRoot = process.argv[2] || 'api';
    const pattern = `${srcRoot}/**/*.{js,ts}`;
    const files = glob.sync(pattern, { nodir: true });

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
