import tl = require('azure-pipelines-task-lib/task');
var https = require('follow-redirects').https;
import * as fs from 'fs';
const tmpPath = "/tmp/"
async function run() {
    try {
        console.log('starting reporting task');
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
            repositoryName: GIT_REPO_NAME,
            gitReopsitoryUrl: GIT_REPOSITORY_URI,
            projectId: PROJECT_ID,
            projectName: PROJECT_NAME,
            vulnerabilitiesFile: JSON.parse(contents)

        }
        console.log(input);


        console.log('Connection Endpoint', reportServerEndpoint);
        const url = tl.getEndpointUrl(reportServerEndpoint, false);
        const token = tl.getEndpointAuthorizationParameter(
            reportServerEndpoint,
            "apitoken",
            false
        );
        console.log(url, token);
        if (url) {
            await post(url, input);
        }

        tl.setResult(tl.TaskResult.Succeeded, 'Successfully Completed the task.');

    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

async function post(url: string, data: any) {
    const dataString = JSON.stringify(data)

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length,
            'x-functions-key': 'o37f2_-_J7EJhdhnzx6vBaw31WXJvRgRtGiEi63zZXseAzFu2QtuCA==',
        },
        timeout: 1000, // in ms
    }

    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res: any) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                return reject(new Error(`HTTP status code ${res.statusCode}`))
            }

            const body: any = []
            res.on('data', (chunk: any) => body.push(chunk))
            res.on('end', () => {
                const resString = Buffer.concat(body).toString()
                resolve(resString)
            })
        })

        req.on('error', (err: any) => {
            reject(err)
        })

        req.on('timeout', () => {
            req.destroy()
            reject(new Error('Request time out'))
        })

        req.write(dataString)
        req.end()
    })
}

run();