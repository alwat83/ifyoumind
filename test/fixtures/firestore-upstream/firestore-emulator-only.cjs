const credentialPattern = /^(GOOGLE_APPLICATION_CREDENTIALS|FIREBASE_TOKEN|GCP_SA_KEY|GOOGLE_OAUTH_ACCESS_TOKEN|CLOUDSDK_AUTH_ACCESS_TOKEN|CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE|OPENAI_API_KEY|STRIPE_.*KEY|AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN))$/;
function emulatorOnly(env = process.env) {
  if (env.GCLOUD_PROJECT !== 'demo-ifyoumind' || env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') {
    throw Error('Requires exact loopback emulator and demo-ifyoumind. No cloud fallback.');
  }
  for (const [key, value] of Object.entries(env)) {
    if (value && credentialPattern.test(key)) throw Error('Credential-bearing environment refused: ' + key);
  }
}
module.exports = { emulatorOnly };
