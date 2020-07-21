const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * Project line in sln file regular expression
 * Groups:
 *  [0]: Full line
 *  [1]: Project type guid
 *  [2]: Project name
 *  [3]: Project guid
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
var projectNameRegex;// = new RegExp(`^${projectName}\\.(.+)\\.(.+)$`);

/**
 * Project path regular expression
 * Groups:
 *  [0]: Full project path
 *  [1]: Layer name
 *  [2]: Project name
 *  [3]: Website folder name
 *  [4]: Full project name
 * Example: "src\Foundation\ORM\code\Helixbase.Foundation.ORM.csproj"
 */
const projectPathRegex = new RegExp(`^src\\\\(.+)\\\\(.+)\\\\(.+)\\\\(.+)\\.csproj$`);

/**
 * Project reference regular expression
 * Groups:
 *  [0]: Full project reference line
 *  [1]: Path excluding '\code' and csproj file name
 *  [2]: Website folder name
 *  [3]: Project file name excluding '.csproj'
 * Example: "<ProjectReference Include="..\..\..\Feature\Redirects\code\Helixbase.Feature.Redirects.csproj">"
 */
const projectReferenceRegex = /<ProjectReference Include=\"(.+)\\(.+)\\(.+)\.csproj\"/;

const slnProjectFolderGuid = '2150E333-8FDC-42A3-9474-1A3956D46DE8';
const slnProjectWebsiteGuid = 'FAE04EC0-301F-11D3-BF4B-00C04F79EFBC';

/**
 * Project Entry class
 * Properties:
 *  Name: Name of the project
 *  Path: Path of the project
 *  Layer: Layer of the project
 *  IsFolderCorrect: Is project placed in proper folder
 *  IsFileNameCorrect: Is file name of the project correct
 *  IncorrectReferences: Array of incorrect references
 */
class ProjectEntry {
    constructor(name, path, layer, isFolderCorrect, isFileNameCorrect) {
        this.Name = name;
        this.Path = path;
        this.Layer = layer;
        this.IsFolderCorrect = isFolderCorrect;
        this.IsFileNameCorrect = isFileNameCorrect;

        this.IncorrectReferences = [];
    }
}

/**
 * Analysis object
 */
global.Analysis = {
    Solution: {
        HasFeatureFolder: false,
        HasFoundationFolder: false,
        HasProjectFolder: false
    },
    Projects: [ ]
};

/**
 * Configuration object
 */
global.Config = {
    SolutionFile: "",
    ProjectName: "",
    WebsiteFolder: "",

    SolutionPath: ""
};

/**
 * Main check method
 */
async function check() {

    try {
        var result = false;
        
        readConfig();

        console.log(`Solution file: ${global.Config.SolutionFile}`);
        console.log(`Project name: ${global.Config.ProjectName}`);

        if (fs.existsSync(global.Config.SolutionFile)) {
            console.log('Solution file exists.');

            await analyzeSln(global.Config.SolutionFile, global.Config.ProjectName);
            await analyzeProjects();
            result = checkResult();
        } 
        
        else {
            core.setFailed('Solution file does not exist.');
        }

        const time = (new Date()).toTimeString();
        core.setOutput('time', time);
        
        core.setOutput('result', result);

        if (!result) {
            core.setFailed("Solution is not Helix compliant.");
        }
        else {
            core.info("Solution is Helix compliant.")
        }

        // Get the JSON webhook payload for the event that triggered the workflow
        //const payload = JSON.stringify(github.context.payload, undefined, 2)
        //console.log(`The event payload: ${payload}`);

    } 
    catch (error) {
        core.setFailed(error.message);
    }
}

/**
 * Analyzes solution file
 * @param {string} slnPath 
 * @param {string} projectName 
 */
async function analyzeSln(slnPath, projectName) {
    projectNameRegex = new RegExp(`^${projectName}\\.(.+)\\.(.+)$`);

    return new Promise((resolve, reject) => {
        const readInterface = readline.createInterface({
            input: fs.createReadStream(slnPath),
            output: process.stdout,
            console: false
        });
    
        readInterface.on('line', function(line) {
            var projectLineMatch = line.match(projectLineRegex);

            if (projectLineMatch != null && projectLineMatch.length >= 5) {
                var projectTypeFromLine = projectLineMatch[1];
                var projectNameFromLine = projectLineMatch[2];
                var projectPathFromLine = projectLineMatch[3];

                // - Project in sln is a folder
                if (projectTypeFromLine == slnProjectFolderGuid) {
                    if (projectNameFromLine == "Feature") {
                        global.Analysis.Solution.HasFeatureFolder = true;
                    }
                    else if (projectNameFromLine == "Foundation") {
                        global.Analysis.Solution.HasFoundationFolder = true;
                    }
                    else if (projectNameFromLine == "Project") {
                        global.Analysis.Solution.HasProjectFolder = true;
                    }
                }

                // - Handle project -
                else if (projectNameFromLine.startsWith(projectName) && !projectNameFromLine.endsWith("Tests") && projectNameFromLine != `${global.Config.ProjectName}.Website`) { // TODO: Add check for Tests project
                    var projectNameMatch = projectNameFromLine.match(projectNameRegex);

                    var projectEntry = new ProjectEntry(projectNameFromLine, projectPathFromLine, false, false);

                    if (projectNameMatch == null) {
                        core.warning(`Couldn't match ${projectNameFromLine} with project name regex`)
                    }

                    else if (projectNameMatch.length >= 3) {
                        projectEntry.Layer = projectNameMatch[1];
                        var projectPathMatch = projectPathFromLine.match(projectPathRegex);

                        if (projectPathMatch == null) {
                            core.warning(`Couldn't match ${projectPathFromLine} with project path regex`)
                            projectEntry.IsFolderCorrect = false;
                        }
                        else if (projectPathMatch.length >= 5) {
                            // - Check if folder is correct - layer name -
                            projectEntry.IsFolderCorrect = (projectPathMatch[1] == projectEntry.Layer && projectPathMatch[3] == global.Config.WebsiteFolder);

                            // - Check if file name is correct -
                            projectEntry.IsFileNameCorrect = (projectPathMatch[4] == projectNameFromLine);
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

/**
 * Anylyzes all projects
 */
async function analyzeProjects() {
    for (const project of global.Analysis.Projects) {
        await analyzeProjectFile(project);
    }
}

/**
 * Analyzes project file
 * @param {ProjectEntry} project 
 */
async function analyzeProjectFile(project) {
    return new Promise((resolve, reject) => {

        try {
            var re = /\\/g;
            var path = global.Config.SolutionPath + "/" + project.Path.replace(re, '/');
    
            if (fs.existsSync(path)) {
                const readInterface = readline.createInterface({
                    input: fs.createReadStream(path),
                    output: process.stdout,
                    console: false
                });
            
                readInterface.on('line', function(line) {
                    var projectReferenceMatch = line.match(projectReferenceRegex);
        
                    if (projectReferenceMatch != null && projectReferenceMatch.length >= 4) {
                        var projectReferenced = projectReferenceMatch[3];
        
                        var projectNameMatch = projectReferenced.match(projectNameRegex);
        
                        if (projectNameMatch == null) {
                            core.warning(`Couldn't match ${projectReferenced} with project name regex`);
                        }
        
                        else if (projectNameMatch.length >= 3) {
                            projectReferencedLayer = projectNameMatch[1];
        
                            if (project.Layer == "Feature") {
                                if (projectReferencedLayer != "Foundation") {
                                    project.IncorrectReferences.push(projectReferenced);
                                }
                            }
                            else if (project.Layer == "Foundation") {
                                if (projectReferencedLayer != "Foundation") {
                                    project.IncorrectReferences.push(projectReferenced);
                                }
                            }
                            else if (project.Layer == "Project") {
                                if (projectReferencedLayer == "Project") {
                                    project.IncorrectReferences.push(projectReferenced);
                                }
                            }
                        }
                    }
                })
                .on('close', () => {
                    resolve('finished');
                })
                .on('error', err => {
                    core.warning(`Couldn't open ${path}`);
                    resolve('finished');
                });
            }
            else {
                core.warning(`${path} doesn't exist in file system`);
                resolve('finished');
            }
        } 
        catch (error) {            
            core.warning(error);
            resolve('finished');
        }        
    });
}

/**
 * Checks analysis result
 */
function checkResult() {
    var result = true;

    if (!global.Analysis.Solution.HasFeatureFolder) {
        console.log('No Feature folder in solution structure');
        result = false;
    }

    if (!global.Analysis.Solution.HasFoundationFolder) {
        console.log('No Foundation folder in solution structure');
        result = false;
    }
    
    if (!global.Analysis.Solution.HasProjectFolder) {
        console.log('No Project folder in solution structure');
        result = false;
    }

    if (global.Analysis.Projects != null) {
        global.Analysis.Projects.forEach((project) => {
            if (!project.IsFolderCorrect || !project.IsFileNameCorrect || project.IncorrectReferences != null && project.IncorrectReferences.length > 0) {
                console.log();
                core.warning(`Issues with project ${project.Name}`);
            }
            
            if (!project.IsFolderCorrect) {
                console.log(` Folder incorrect: ${project.Path}`);
                result = false;
            }

            if (!project.IsFileNameCorrect) {
                console.log(` File name incorrect in sln file`);
                result = false;
            }

            if (project.IncorrectReferences != null && project.IncorrectReferences.length > 0) {
                console.log(` Incorrect references:`);
                project.IncorrectReferences.forEach(reference => {
                    console.log(`  - ${reference}`);
                });
                result = false;
            }
        });
    }

    return result;
}

function readConfig() {
    global.Config.SolutionFile = core.getInput('solution-file');
    global.Config.ProjectName = core.getInput('project-name');
    global.Config.WebsiteFolder = core.getInput('website-folder');

    global.Config.SolutionPath = path.dirname(global.Config.SolutionFile);
}

module.exports = check;
