export default {
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogTitle: '# Changelog' }],
    '@semantic-release/npm',
    '@semantic-release/github',
    ['@semantic-release/git', { message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}'} ],
  ],
};
