[![npm](https://img.shields.io/npm/v/ng-extract-i18n-reverse)](https://www.npmjs.com/package/ng-extract-i18n-merge)
[![Coverage Status](https://coveralls.io/repos/github/daniel-sc/ng-extract-i18n-reverse/badge.svg?branch=master)](https://coveralls.io/github/daniel-sc/ng-extract-i18n-reverse?branch=master)
[![CodeQL](https://github.com/daniel-sc/ng-extract-i18n-reverse/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/daniel-sc/ng-extract-i18n-reverse/actions/workflows/github-code-scanning/codeql)

# Angular extract i18n and reverse-merge

This extends Angular CLI to improve the i18n extraction. It adds functionality to reverse-merge target translation files
back to source code

## Install

_Prerequisites_: i18n setup with defined target locales in `angular.json` - as
documented [here](https://angular.io/guide/i18n-common-merge).

```shell
ng add ng-extract-i18n-reverse
```

## Usage

```shell
ng extract-i18n # yes, same as before - this replaces the original builder
```

### Configuration

In your `angular.json` the target `extract-i18n` that can be configured with the following options:

| Name            | Default                                                          | Description                                                                                                                                             |
|-----------------|------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `browserTarget` | Inferred from current setup by `ng add`                          | A browser builder target to extract i18n messages in the format of `project:target[:configuration]`. See https://angular.io/cli/extract-i18n#options    |
| `format`        | Inferred from current setup by `ng add`                          | Any of `xlf`, `xlif`, `xliff`, `xlf2`, `xliff2`                                                                                                         |
| `outputPath`    | Inferred from current setup by `ng add`                          | Path to folder containing all (source and target) translation files.                                                                                    |
| `targetFiles`   | Inferred from current setup by `ng add`                          | Filenames (relative to `outputPath` of all target translation files (e.g. `["messages.fr.xlf", "messages.de.xlf"]`).                                    |
| `sourceFile`    | `messages.arb`. `ng add` tries to infer non default setups.      | Filename (relative to `outputPath` of source translation file (e.g. `"translations-source.arb"`).                                                       |
| `targetPath`    | none                                                             | Path to folder containing target file for further comparison                                                                                            |
| `targetFile`    | `messages.en-US.arb`. `ng add` tries to infer non default setups.| Filename (relative to `targetPath` of target translation file which is used for further comparison with source file (e.g. `"translations-target.arb"`). |
| `check`         | `false`.                                                         | Whether to compare target file with source file to find differences                                                                                     |

## Contribute

Feedback and PRs always welcome :-)

Before developing complex changes, I'd recommend opening an issue to discuss whether the indented goals match the scope of this package.
