const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

async function check() {

    try {

        const solutionFile = core.getInput('solution-file');
        console.log(`Solution file: ${solutionFile}!`);

        const time = (new Date()).toTimeString();
        core.setOutput('time', time);
        
        core.setOutput('result', 'true');

        // Get the JSON webhook payload for the event that triggered the workflow
        const payload = JSON.stringify(github.context.payload, undefined, 2)
        console.log(`The event payload: ${payload}`);

    } catch (error) {
        core.setFailed(error.message);
    }

}

module.exports = check;
