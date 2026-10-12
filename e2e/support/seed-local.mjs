// Creates named QA accounts in an already running emulator suite (`npm run emulators`), for manual
// local testing. Emulator only: the defaults below point the Admin SDK at 127.0.0.1, never at Firebase.
// Usage: npm run qa:seed            → prints the accounts
//        npm run qa:seed -- --clean → removes the accounts this script created earlier
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

const { FIXTURES, FIXTURE_PASSWORD, cleanupFixture, createFixture, remainingFixtureUsers, seedCensusCache } =
  await import('./fixtures.mjs');

if (process.argv.includes('--clean')) {
  const users = (await remainingFixtureUsers()).filter(user => user.email.includes('.local@'));
  for (const user of users) await cleanupFixture({ email: user.email, uid: user.uid });
  console.log(`Removed ${users.length} local QA account(s).`);
  process.exit(0);
}

await seedCensusCache();
const plan = [
  [FIXTURES.UNVERIFIED, { verified: false, workspace: false }],
  [FIXTURES.VERIFIED, {}],
  [FIXTURES.FREE_WITH_DECISION, { decisions: 1 }],
  [FIXTURES.OTHER_TENANT, { decisions: 1 }],
];
console.log(`Local QA accounts (password for all: ${FIXTURE_PASSWORD})`);
for (const [id, options] of plan) {
  const fixture = await createFixture(id, { ...options, runId: 'local' }).catch(error => ({ fixtureId: id, error }));
  if (fixture.error) console.log(`- ${id}: ${/EMAIL_EXISTS/.test(fixture.error.message) ? 'already exists' : fixture.error.message}`);
  else console.log(`- ${id}: ${fixture.email}${fixture.projectIds.length ? ` (decision /app/result/${fixture.projectIds[0]})` : ''}`);
}
console.log('Cities with seeded Census data: Springfield, IL; Madison, WI; Columbus, OH.');
process.exit(0);
