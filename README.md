# Helix Check GitHub Action
GitHub action for Sitecore projects which follow Helix principles - https://helix.sitecore.net/. Checks if solution complies with Helix rules.

## Inputs

| Input  | Description | Usage |
| ---              |  ---   |   ---   |
| `solution-file`  | Path to the solution that will be analyzed.  | Required |
| `project-name`   | The name of your project. | Required |
| `website-folder` | The name of the folder that always contain website project file.<br/> Default `"website"`. | Optional |

## Outputs

| Output  | Description | 
| ---       |     ---   | 
| `result`  | Boolean result of the analysis. True if helix check successfull. |
| `time`    | The time check has been made. |

## Example usage

### Workflow

```
uses: ethisysltd/helix-check@v1.0
id: check
with:
    solution-file: 'Helixbase.sln'
    project-name: 'Helixbase'
    website-folder: 'website'
```

### Successful result
```
Solution file: Helixbase.sln
Project name: Helixbase
Solution file exists.
Solution is Helix compliant.
```

### Unsuccessful result
```
Solution file: invalid/Helixbase-Invalid.sln
Project name: Helixbase
Solution file exists.

##[warning]Issues with project Helixbase.Foundation.ORM
 Folder incorrect: src\Feature\ORM\code\Helixbase.Foundation.ORM.csproj

##[warning]Issues with project Helixbase.Feature.Hero
 Folder incorrect: src\Foundation\Hero\code\Helixbase.Feature.Hero.csproj

##[warning]Issues with project Helixbase.Project.Helixbase
 Incorrect references:
  - Helixbase.Project.Common

##[warning]Issues with project Helixbase.Feature.VersionTrim
 Incorrect references:
  - Helixbase.Project.Common
  - Helixbase.Feature.ShowTitles

##[warning]Issues with project Helixbase.Foundation.Core
 Incorrect references:
  - Helixbase.Feature.Redirects
  - Helixbase.Project.Common

##[error]Solution is not Helix compliant.
```
