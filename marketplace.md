# Deltatre - Trivy Reporter 

This extension is used to report trivy generated reports to central location for reporting. It has two components
* Azure Devops Service connection extention
* Azure DevOps Pipeline Task 

> Note Azure DevOps Server: Since this extension is private, make sure you install it on Azure DevOps Server.

## Azure DevOps Server Installation 

* Navigate to the Azure DevOps Server Extensions page on your server. (For example, http://someserver/_gallery/manage)
* Click upload new extension and select the file you have just downloaded.
* After the extension has successfully uploaded, click Install and select the Team Project Collection to install into.

## Getting Started

Currently, this extension works only with Official Trivy Azure DevOps Extension.

### Step 1 : Create & Configure Service Connection in Azure Devops

* Go to Project Settings - > Service Connections 
* Search for Trivy Reporter
* Enter Endpoint : https://scanner-functions.azurewebsites.net/api/scanner-api-function
* Token - Please request API token from Cyber Security Team.
* Enter `name` and `description`
* Click on Save

Step 2: Configure Build pipeline with Trivy Reporter Task

* Create or Modify existing pipeline - 

If pipeline is using Official Trivy Azure DevOps Task - Trivy Reporter Task has to be places after trivy scanning. This will ensure Trivy Reporter extension will automatically pull vulnerability reports. 

Example:

```yaml
# Official Trivy pipeline task
- task: trivy@1
  inputs:
    version: 'latest'
    docker: false
    image: 'vulnerables/cve-2014-6271'
    exitCode: 0
# Deltatre trivy reporter pipeline task
- task: TrivyReporter@2
  inputs:
    reportServerEndpoint: 'trivy-reporter'
    scannerResultsFile: 'default'
```