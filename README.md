# Helix Check GitHub Action
GitHub action for Sitecore projects which follow Helix principles - https://helix.sitecore.net/. Checks if solution complies with Helix rules.

## General rules

### Projects references:

- _Feature_ layer projects can only reference _Foundation_
- _Foundation_ layer projects can only reference other _Foundations_
- _Project_ layer projects can reference _Feature_ and _Foundation_ but not other _Projects_

### Folders structure and naming convention:

- There are layer folders specified in the solution
  - Feature
  - Foundation
  - Project

- Projects are placed in correct folders, for example:
  - `src\Foundation\ORM\website\Helixbase.Foundation.ORM.csproj` - correct
  - `src\Feature\ORM\website\Helixbase.Foundation.ORM.csproj` - incorrect


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
name: Helix Check

on:
  push:
    branches: [ develop, master ]
  pull_request:
    branches: [ develop, master ]

jobs:
  check_job:
    name: Helix check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Helix Check
        uses: ethisysltd/helix-check@v1.0
        id: check
        with:
          solution-file: 'Helixbase.sln'
          project-name: 'Helixbase'
          website-folder: 'website'
      
      - name: Get the check result
        run: echo "Check result - ${{ steps.check.outputs.result }}"
      
      - name: Get the output time
        run: echo "The time was - ${{ steps.check.outputs.time }}"
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
