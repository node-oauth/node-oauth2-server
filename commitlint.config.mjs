export default {
  extends: ['@commitlint/config-conventional'],
  // GitHub writes this message when it merges a security advisory's private fork
  ignores: [(message) => message.startsWith('Merge commit from fork')],
  rules: {
    // disable max body line length - otherwise dependabot can error
    'body-max-line-length': [0],
  },
};
