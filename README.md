# helix-check
GitHub action for Sitecore projects that checks if solution is Helix compliant

## Inputs

### `solution-file`

**Required** Path to the solution that will be analyzed.

### `project-name`

**Required** The name of your project.

### `website-folder`

**Required** The name of the folder that always contain website project file. Default `"website"`.


## Outputs

### `result`

Boolean result of the analysis. True if helix check successfull.

### `time`

The time check has been made.

## Example usage

```
uses: ethisysltd/helix-check@v1.0
id: check
with:
    solution-file: 'Helixbase.sln'
    project-name: 'Helixbase'
    website-folder: 'website'
```
