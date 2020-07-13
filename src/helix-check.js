const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const readline = require('readline');

class ProjectEntry {
    constructor(Name, IsFileNameCorrect, HasProjectFolder) {
        this.Name = Name;
        this.IsFileNameCorrect = IsFileNameCorrect;
        this.HasProjectFolder = HasProjectFolder;
    }
}

global.Analysis = {
    Solution: {
        HasFeatureFolder: false,
        HasFoundationFolder: false,
        HasProjectFolder: false
    },
    Projects: [
        // {
        //     Name: '',
        //     IsFileNameCorrect: false,
        //     IsFolderCorrect: false
        // }
    ]
};

async function check() {

    try {
        var result = false;
        
        const solutionFile = core.getInput('solution-file');
        const projectName = core.getInput('project-name');

        console.log(`Solution file: ${solutionFile}`);
        console.log(`Project name: ${projectName}`);

        if (fs.existsSync(solutionFile)) {
            console.log('Solution file exists.');

            await analyze(solutionFile, projectName);
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

    } 
    catch (error) {
        core.setFailed(error.message);
    }

}

async function analyze(slnPath, projectName) {
    return new Promise((resolve, reject) => {
        /**
         * Project line in sln file regular expression
         * Groups:
         *  [0]: Full line
         *  [1]: Project guid
         *  [2]: Project name
         *  [3]: Project path
         *  [4]: Project parent guid
         */
        const projectLineRegex = /^Project\(\"{(.+)}\"\) \= \"(.+)\", \"(.+)\", \"{(.+)}\"/;

        /**
         * Project name regular expression
         * Groups:
         *  [0]: Full project name
         *  [1]: Layer name
         *  [2]: Project name
         * Example: "Helixbase.Foundation.ORM"
         */
        const projectNameRegex = new RegExp(`^${projectName}\\.(.+)\\.(.+)$`);

        /**
         * Project path regular expression
         * Groups:
         *  [0]: Full project path
         *  [1]: Layer name
         *  [2]: Project name
         *  [3]: Full project name
         * Example: "src\Foundation\ORM\code\Helixbase.Foundation.ORM.csproj"
         */
        const projectPathRegex = new RegExp(`^src\\\\(.+)\\\\(.+)\\\\code\\\\(.+)\\.csproj$`);

        const readInterface = readline.createInterface({
            input: fs.createReadStream(slnPath),
            output: process.stdout,
            console: false
        });
    
        readInterface.on('line', function(line) {
            //console.log(line);
            var projectLineMatch = line.match(projectLineRegex);

            if (projectLineMatch != null && projectLineMatch.length >= 5) {
                var projectNameFromLine = projectLineMatch[2];
                if (projectNameFromLine == "Feature") {
                    global.Analysis.Solution.HasFeatureFolder = true;
                }
                else if (projectNameFromLine == "Foundation") {
                    global.Analysis.Solution.HasFoundationFolder = true;
                }
                else if (projectNameFromLine == "Project") {
                    global.Analysis.Solution.HasProjectFolder = true;
                }

                else if (projectNameFromLine.startsWith(projectName)) {
                    var projectNameMatch = projectNameFromLine.match(projectNameRegex);

                    var projectEntry = new ProjectEntry(projectNameFromLine, false, false);

                    if (projectNameMatch == null) {
                        console.warn(`Couldn't match ${projectNameFromLine} with project path regex`)
                    }

                    else if (projectNameMatch.length >= 3) {
                        var layer = projectNameMatch[1];
                        var path = projectLineMatch[3];
                        var projectPathMatch = path.match(projectPathRegex);

                        if (projectPathMatch == null) {
                            console.warn(`Couldn't match ${path} with project path regex`)
                            projectEntry.IsFolderCorrect = false;
                        }
                        else if (projectPathMatch.length >= 4) {
                            // - Check if folder is correct - layer name -
                            projectEntry.IsFolderCorrect = (layer == projectPathMatch[1]);

                            // - Check if file name is correct -
                            projectEntry.IsFileNameCorrect = (projectNameFromLine == projectPathMatch[3])
                        }
                    }

                    global.Analysis.Projects.push(projectEntry);
                }
            }        
        })
        .on('close', () => {
            resolve('finished');
        })
        .on('error', err => {
            reject(err);
        });
    });
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

    if (global.Analysis.Projects != null) {
        global.Analysis.Projects.forEach((project) => {
            if (!project.IsFolderCorrect) {
                console.warn(`Folder incorrect for project ${project.Name}`);
                result = false;
            }

            if (!project.IsFileNameCorrect) {
                console.warn(`File name incorrect for project ${project.Name}`);
                result = false;
            }
        });
    }

    return result;
}

module.exports = check;
