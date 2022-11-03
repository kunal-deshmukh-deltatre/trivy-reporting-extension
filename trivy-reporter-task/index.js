"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
var https = require('follow-redirects').https;
const fs = __importStar(require("fs"));
const tmpPath = "/tmp/";
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting reporting task....');
            const inputPath = tl.getInput('scannerResultsFile', true);
            const reportServerEndpoint = tl.getInput('reportServerEndpoint', true) || 'sdf';
            let contents = '';
            if ((inputPath === null || inputPath === void 0 ? void 0 : inputPath.toLowerCase()) === 'default') {
                console.log(`Reading default file path`);
                var files = fs.readdirSync(tmpPath).filter((fn) => {
                    return fn.startsWith('trivy-results-');
                });
                if (files && files.length > 0) {
                    contents = fs.readFileSync(`${tmpPath}${files[0]}`, 'utf8');
                }
                else {
                    console.error(`Unable to read default trivy results file.`);
                    tl.setResult(tl.TaskResult.Failed, `Unable to read default trivy results file.`);
                }
            }
            else {
                console.log(`Reading results file from ${inputPath}`);
                contents = fs.readFileSync(inputPath, 'utf8');
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
            };
            const url = tl.getEndpointUrl(reportServerEndpoint, false);
            console.log('Connection Endpoint being used: ', url);
            const token = tl.getEndpointAuthorizationParameter(reportServerEndpoint, "apitoken", false);
            if (url && token) {
                yield post(url, input, token);
                console.log('Results reported successfully.');
                tl.setResult(tl.TaskResult.Succeeded, 'Successfully Completed the task.');
            }
            else {
                console.error('Issue with Service connection configuration.');
                tl.setResult(tl.TaskResult.SucceededWithIssues, 'Issue with Service connection configuration.');
            }
        }
        catch (err) {
            console.error(`Error: ${err.message || err}`);
            tl.setResult(tl.TaskResult.SucceededWithIssues, err.message);
        }
    });
}
function post(url, data, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const dataString = JSON.stringify(data);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': dataString.length,
                'x-functions-key': token,
            },
            timeout: 1000, // in ms
        };
        return new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                if (res.statusCode < 200 || res.statusCode > 299) {
                    return reject(new Error(`HTTP status code ${res.statusCode}`));
                }
                const body = [];
                res.on('data', (chunk) => body.push(chunk));
                res.on('end', () => {
                    const resString = Buffer.concat(body).toString();
                    resolve(resString);
                });
            });
            req.on('error', (err) => {
                reject(err);
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request time out'));
            });
            req.write(dataString);
            req.end();
        });
    });
}
run();
