import tl = require('azure-pipelines-task-lib/task');

import * as fs from 'fs';
const tmpPath = "/tmp/"
async function run() {
    try {
        const trivyResultPath = tmpPath + "trivy-results-*.json";
        var files = fs.readdirSync(tmpPath).filter((fn) => {
            console.log(fn);
            return fn.startsWith('trivy-results-')
        });
        let contents: string = '';
        console.log('Searching files', files[0]);
        if (files && files.length > 0) {
            contents = fs.readFileSync(`${tmpPath}${files[0]}`, 'utf8')
        }

        const inputString: string | undefined = tl.getInput('scannerResultsFile', true);
        const reportServerEndpoint: string = tl.getInput('reportServerEndpoint', true) || 'sdf';
        if (inputString == 'bad') {
            tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
            return;
        }
        console.log('Hello Task', inputString);

        const GIT_BRANCH = tl.getVariable("Build.Repository.Name");
        const GIT_COMMIT_ID = tl.getVariable("Build.SourceVersion");
        const PROJECT_NAME = tl.getVariable("System.TeamProject");
        const GIT_REPOSITORY_URI = tl.getVariable("Build.Repository.Uri");
        const PROJECT_ID = tl.getVariable("System.TeamProjectId");
        const GIT_REPO_NAME = tl.getVariable("Build.Repository.Name");

        const input = {
            gitBranch: GIT_BRANCH,
            gitCommitID: GIT_COMMIT_ID,
            gitRepositoryName: GIT_REPO_NAME,
            gitReopsitoryUrl: GIT_REPOSITORY_URI,
            projectId: PROJECT_ID,
            projectName: PROJECT_NAME,
            contents: JSON.parse(contents)

        }
        console.log(input);


        console.log('Connection Endpoint', reportServerEndpoint);
        const url = tl.getEndpointUrl(reportServerEndpoint, false);
        const token = tl.getEndpointAuthorizationParameter(
            reportServerEndpoint,
            "apitoken",
            false
        );
        console.log(url, token)
        tl.addAttachment
    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();