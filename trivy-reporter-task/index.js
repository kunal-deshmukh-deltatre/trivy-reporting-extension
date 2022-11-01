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
const fs = __importStar(require("fs"));
const tmpPath = "/tmp/";
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const trivyResultPath = tmpPath + "trivy-results-*.json";
            var files = fs.readdirSync(tmpPath).filter((fn) => {
                console.log(fn);
                return fn.startsWith('trivy-results-');
            });
            let contents = '';
            console.log('Searching files', files[0]);
            if (files && files.length > 0) {
                contents = fs.readFileSync(`${tmpPath}${files[0]}`, 'utf8');
            }
            const inputString = tl.getInput('scannerResultsFile', true);
            const reportServerEndpoint = tl.getInput('reportServerEndpoint', true) || 'sdf';
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
            };
            console.log(input);
            console.log('Connection Endpoint', reportServerEndpoint);
            const url = tl.getEndpointUrl(reportServerEndpoint, false);
            const token = tl.getEndpointAuthorizationParameter(reportServerEndpoint, "apitoken", false);
            console.log(url, token);
            tl.addAttachment;
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
