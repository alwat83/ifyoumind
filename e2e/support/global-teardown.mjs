import { remainingFixtureUsers } from './fixtures.mjs';

/** Every test cleans up its own fixtures; anything left over is a lifecycle bug and fails the run. */
export default async function globalTeardown() {
  const leftovers = await remainingFixtureUsers();
  if (leftovers.length) {
    throw new Error(`Fixture accounts were not cleaned up: ${leftovers.map(user => user.email).join(', ')}`);
  }
}
