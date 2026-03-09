const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
const projectId = process.env.GCP_PROJECT_ID;

/**
 * Load secrets from Google Secret Manager in Cloud Run
 * In development, secrets are loaded from .env file via dotenv
 */
async function loadSecrets() {
  // Only load from Secret Manager if GCP_PROJECT_ID is set
  if (!projectId) {
    console.log('GCP_PROJECT_ID not set - using .env file for configuration');
    return;
  }

  // Detect environment (dev, dev1, dev2, or prod)
  const environment = process.env.ENVIRONMENT || 'dev';
  console.log(`Loading secrets from Secret Manager for project: ${projectId}, environment: ${environment}`);

  // Get secret mappings based on environment
  const secretMappings = getSecretMappings(environment);

  try {
    for (const [envVar, secretName] of Object.entries(secretMappings)) {
      try {
        const [version] = await client.accessSecretVersion({
          name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
        });

        const secretValue = version.payload.data.toString();
        process.env[envVar] = secretValue;

        console.log(`✓ Loaded secret: ${envVar}`);
      } catch (error) {
        console.error(`✗ Failed to load secret ${envVar} from ${secretName}:`, error.message);
        throw error;
      }
    }

    console.log('✓ All secrets loaded successfully from Secret Manager');
  } catch (error) {
    console.error('Failed to load secrets from Secret Manager:', error);
    throw error;
  }
}

/**
 * Get secret mappings based on environment
 */
function getSecretMappings(environment) {
  if (environment === 'prod') {
    return {
      'REACT_APP_API_URL': 'react-app-api-url-coach-portal',
      'NODE_ENV': 'node-env'
    };
  } else if (environment === 'dev2') {
    return {
      'REACT_APP_API_URL': 'react-app-api-url-coach-portal-dev2',
      'NODE_ENV': 'node-env-dev'
    };
  } else if (environment === 'dev1') {
    return {
      'REACT_APP_API_URL': 'react-app-api-url-coach-portal-dev1',
      'NODE_ENV': 'node-env-dev'
    };
  } else {
    // dev (default)
    return {
      'REACT_APP_API_URL': 'react-app-api-url-coach-portal-dev',
      'NODE_ENV': 'node-env-dev'
    };
  }
}

module.exports = { loadSecrets };
