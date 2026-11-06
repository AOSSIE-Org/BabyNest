// Run the tests in India time. Date bugs that only show up east of UTC stay
// hidden in UTC, which is what CI uses. This has to be set here: Jest gives test
// files their own copy of process.env, so setting TZ in a test does nothing.
process.env.TZ = 'Asia/Kolkata';

module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-phone-call)',
  ],
};
