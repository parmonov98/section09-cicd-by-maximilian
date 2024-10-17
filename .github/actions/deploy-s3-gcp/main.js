const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');

async function run() {
    try {
        // Get inputs from the action
        const bucketName = core.getInput('bucket_name', { required: true });
        const sourceDir = core.getInput('source_dir', { required: true });

        // Write the service account key to a temporary file
        const serviceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
        const keyFilePath = './gcp-key.json';
        fs.writeFileSync(keyFilePath, serviceAccountKey);

        // Authenticate using the service account key
        await exec.exec('gcloud', ['auth', 'activate-service-account', '--key-file', keyFilePath]);

        // Set the project (if needed, you can also set it as a secret)
        await exec.exec('gcloud', ['config', 'set', 'project', process.env.GCP_PROJECT_ID]);

        // Deploy files to GCS bucket
        await exec.exec('gsutil', ['-m', 'cp', '-r', `${sourceDir}/*`, `gs://${bucketName}/`]);

        core.info('Deployment to GCS completed successfully!');
    } catch (error) {
        core.setFailed(`Action failed with error: ${error}`);
    }
}

run();