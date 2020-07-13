const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const readline = require('readline');

var Analysis = {
    Solution: {
        HasFeatureFolder: false,
        HasFoundationFolder: false,
        HasProjectFolder: false
    }
};

async function check() {

    try {
        var result = false;
        
        const solutionFile = core.getInput('solution-file');
        console.log(`Solution file: ${solutionFile}`);


        if (fs.existsSync(solutionFile)) {
            console.log('Solution file exists.');

            analyze(solutionFile);
            result = checkResult();
        } 
        
        else {
            core.setFailed('Solution file does not exist.');
        }




        const time = (new Date()).toTimeString();
        core.setOutput('time', time);
        
        core.setOutput('result', result);

        if (!result) {
            core.setFailed("Solution is not Helix compliant");
        }

        // Get the JSON webhook payload for the event that triggered the workflow
        //const payload = JSON.stringify(github.context.payload, undefined, 2)
        //console.log(`The event payload: ${payload}`);

    } catch (error) {
        core.setFailed(error.message);
    }

}

async function analyze(path) {
    var projectLineRegex = /^Project\("{(.+)}"\) = "(.+)", "(.+)", "{(.+)}"$/;

    const readInterface = readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        console: false
    });

    readInterface.on('line', function(line) {
        var projectLineMatch = line.match(projectLineRegex);

        if (projectLineMatch.length == 5) {
            if (projectLineMatch[2] == "Feature") {
                Analysis.Solution.HasFeatureFolder = true;
            }
            else if (projectLineMatch[2] == "Foundation") {
                Analysis.Solution.HasFoundationFolder = true;
            }
            else if (projectLineMatch[2] == "Project") {
                Analysis.Solution.HasProjectFolder = true;
            }
        }

        //console.log(line);
    });

    // fs.readFile(solutionFile, 'utf8', function(err, contents) {
    //     if (err) {
    //         console.log(err);
    //         core.setFailed(err);
    //     }

    //     console.log(contents);
    // });
}

async function checkResult() {
    var result = true;

    if (!Analysis.Solution.HasFeatureFolder) {
        console.log('No Feature folder in solution structure');
        result = false;
    }

    if (!Analysis.Solution.HasFoundationFolder) {
        console.log('No Foundation folder in solution structure');
        result = false;
    }
    
    if (!Analysis.Solution.HasProjectFolder) {
        console.log('No Project folder in solution structure');
        result = false;
    }

    return result;
}

module.exports = check;
