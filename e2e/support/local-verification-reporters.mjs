// Opt-in structured reports for the offline verification runner. Normal CI is unchanged.
export function verificationReporters(existing) {
  return process.env.LOCAL_VERIFY_JSON ? [...existing, ['json', { outputFile: process.env.LOCAL_VERIFY_JSON }]] : existing;
}
