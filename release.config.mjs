export default {
  preset: 'conventionalcommits',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', { changelogTitle: '# Changelog' }],
    '@semantic-release/npm',
    '@semantic-release/github',
    ['@semantic-release/git', { message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}'} ],
  ],
};
