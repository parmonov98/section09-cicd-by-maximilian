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
        // Check if the key exists
        if (!serviceAccountKey) {
            core.setFailed('Service account key is missing or not set correctly.');
            process.exit(1);
        }

        const keyFilePath = './gcp-key.json';
        fs.writeFileSync(keyFilePath, serviceAccountKey);

        // Verify the contents of the gcp-key.json file
        fs.readFile(keyFilePath, 'utf8', (err, data) => {
            if (err) {
                core.setFailed(`Error reading the file: ${err.message}`);
            } else {
                core.info(`Contents of gcp-key.json: ${data}`);
            }
        });
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