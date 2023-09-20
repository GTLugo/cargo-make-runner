# cargo-make-runner

A quality-of-life plugin for users of `cargo-make`

## Features

Target and profile selection, run and debug play buttons, build button, all in the status bar for convenience.

> Note: This is still very much a WIP

## Requirements

* You must install `cargo-make`
* The extension assumes there exists `run` and `build` tasks.

## Extension Settings

This extension contributes the following settings:

* `cargo_make_runner.target_directory`: The build directory. The release/debug/etc subdirectories are assumed to be in here. This is relative to the workspace.
* `cargo_make_runner.debugger_type_windows`: The debugger to use for debugging on Windows.
* `cargo_make_runner.debugger_type_linux`: The debugger to use for debugging on Linux.
* `cargo_make_runner.debugger_type_mac`: The debugger to use for debugging on Mac.

## Known Issues

None yet, but I expect many.

## Release Notes

### 0.1.0

Initial release. bau bau

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
