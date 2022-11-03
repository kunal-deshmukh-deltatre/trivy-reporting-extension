import tl = require('azure-pipelines-task-lib/task');
var https = require('follow-redirects').https;
import * as fs from 'fs';
const tmpPath = "/tmp/"
async function run() {
    try {
        console.log('Starting reporting task....');
        const inputPath: any = tl.getInput('scannerResultsFile', true);
        const reportServerEndpoint: string = tl.getInput('reportServerEndpoint', true) || 'sdf';
        let contents: string = '';

        if (inputPath?.toLowerCase() === 'default') {
            console.log(`Reading default file path`)
            var files = fs.readdirSync(tmpPath).filter((fn) => {
                return fn.startsWith('trivy-results-')
            });

            if (files && files.length > 0) {
                contents = fs.readFileSync(`${tmpPath}${files[0]}`, 'utf8')
            } else {
                console.error(`Unable to read default trivy results file.`);
                tl.setResult(tl.TaskResult.Failed, `Unable to read default trivy results file.`)
            }
        } else {
            console.log(`Reading results file from ${inputPath}`)
            contents = fs.readFileSync(inputPath, 'utf8')
        }


        const GIT_BRANCH = tl.getVariable("Build.SourceBranch");
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


        const url = tl.getEndpointUrl(reportServerEndpoint, false);
        console.log('Connection Endpoint being used: ', url);
        const token = tl.getEndpointAuthorizationParameter(
            reportServerEndpoint,
            "apitoken",
            false
        );
        if (url && token) {
            await post(url, input, token);
            console.log('Results reported successfully.')
            tl.setResult(tl.TaskResult.Succeeded, 'Successfully Completed the task.');

        } else {
            console.error('Issue with Service connection configuration.')
            tl.setResult(tl.TaskResult.SucceededWithIssues, 'Issue with Service connection configuration.');
        }



    }
    catch (err: any) {
        console.error(`Error: ${err.message || err}`);
        tl.setResult(tl.TaskResult.SucceededWithIssues, err.message);
    }
}

async function post(url: string, data: any, token: any) {
    const dataString = JSON.stringify(data)

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length,
            'x-functions-key': token,
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