const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const readline = require('readline');

async function check() {

    try {
        var result = false;
        
        const solutionFile = core.getInput('solution-file');
        console.log(`Solution file: ${solutionFile}`);


        if (fs.existsSync(solutionFile)) {
            console.log('Solution file exists.');

            const readInterface = readline.createInterface({
                input: fs.createReadStream(solutionFile),
                output: process.stdout,
                console: false
            });

            readInterface.on('line', function(line) {
                console.log(line);
            });

            // fs.readFile(solutionFile, 'utf8', function(err, contents) {
            //     if (err) {
            //         console.log(err);
            //         core.setFailed(err);
            //     }

            //     console.log(contents);
            // });

            result = true;
        } 
        
        else {
            core.setFailed('Solution file does not exist.');
        }




        const time = (new Date()).toTimeString();
        core.setOutput('time', time);
        
        core.setOutput('result', result);

        // Get the JSON webhook payload for the event that triggered the workflow
        //const payload = JSON.stringify(github.context.payload, undefined, 2)
        //console.log(`The event payload: ${payload}`);

    } catch (error) {
        core.setFailed(error.message);
    }

}

module.exports = check;
