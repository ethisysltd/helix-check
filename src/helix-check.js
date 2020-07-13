const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const readline = require('readline');

global.Analysis = {
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

function analyze(path) {
    const projectLineRegex = /Project\(\"{(.+)}\"\) \= \"(.+)\", \"(.+)\", \"{(.+)}\"/;

    const readInterface = readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        console: false
    });

    readInterface.on('line', function(line) {
        console.log(line);
        var projectLineMatch = line.match(projectLineRegex);
        //var projectLineMatch = [...matchAll];
        console.log(projectLineMatch);
        if (projectLineMatch != null && projectLineMatch.length >= 3) {
            console.log("projectLineMatch[2]:  " + projectLineMatch[2]);
            if (projectLineMatch[2] == "Feature") {
                global.Analysis.Solution.HasFeatureFolder = true;
            }
            else if (projectLineMatch[2] == "Foundation") {
                global.Analysis.Solution.HasFoundationFolder = true;
            }
            else if (projectLineMatch[2] == "Project") {
                global.Analysis.Solution.HasProjectFolder = true;
            }
        }        
    });

    // fs.readFile(solutionFile, 'utf8', function(err, contents) {
    //     if (err) {
    //         console.log(err);
    //         core.setFailed(err);
    //     }

    //     console.log(contents);
    // });
}

function checkResult() {
    var result = true;

    if (!global.Analysis.Solution.HasFeatureFolder) {
        console.warn('No Feature folder in solution structure');
        result = false;
    }

    if (!global.Analysis.Solution.HasFoundationFolder) {
        console.warn('No Foundation folder in solution structure');
        result = false;
    }
    
    if (!global.Analysis.Solution.HasProjectFolder) {
        console.warn('No Project folder in solution structure');
        result = false;
    }

    return result;
}

module.exports = check;
