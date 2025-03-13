export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // disable max body line length - otherwise dependabot can error
    'body-max-line-length': [0],
  },
};
