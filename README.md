# cargo-make-runner

<a href='https://ko-fi.com/R6R8PGIU6' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />
<!-- [![ko-fi](vendor/kofi_button_blue.png)](https://ko-fi.com/R6R8PGIU6) -->

A quality-of-life plugin for users of [cargo-make](https://github.com/sagiegurari/cargo-make)

## Features

Target and profile selection, run and debug play buttons, build button, all in the status bar for convenience.
Provides `CARGO_MAKE_RUN_TARGET` cargo-make environment variable which is set to the currently selected target.

> Note: This is still very much a WIP

## Requirements

* You must install [cargo-make](https://github.com/sagiegurari/cargo-make)
* The extension assumes there exists a `build` task in your makefile.

## Extension Settings

This extension contributes the following settings:

* `cargo_make_runner.clearRunTaskTerminal`: Automatically clear the run task terminal before each run.
* `cargo_make_runner.additionalArgs`: Additional arguments to pass to the target when running.
* `cargo_make_runner.useCompactIcons`: Use compact icons in the status bar.
* `cargo_make_runner.targetDirectory`: The build directory. The release/debug/etc subdirectories are assumed to be in here. This is relative to the workspace.
* `cargo_make_runner.debuggerTypeWindows`: The debugger to use for debugging on Windows.
* `cargo_make_runner.debuggerTypeLinux`: The debugger to use for debugging on Linux.
* `cargo_make_runner.debuggerTypeMac`: The debugger to use for debugging on Mac. 

## Known Issues

* Must use a `Makefile.toml` file in the root directory. This may be relaxed in the future.
* Various project structures may break the tool, but requires more testing.
* Does not detect examples.

## Release Notes

### 0.2.1

* Added `cargo_make_runner.clearRunTaskTerminal`.

### 0.2.0

* Finally refactored project files for better structuring.
* Began implementation for tree view section (not implemented in this version).
* Provides `CARGO_MAKE_RUN_TARGET` cargo-make environment variable which is set to the currently selected target.
* Targets section no longer list targets which don't include `[[bin]]` or `src/main.rs`.
* Added `cargo_make_runner.useCompactIcons`.
* Added `cargo_make_runner.additionalArgs`.
* Adjusted status bar icons to mimic the CMake extension.
* All build output for each run option goes into Output panel.
* Run button now no longer depends on a `run` task in the `Makefile.toml`.

### 0.1.2

Removed erroneous "cargo-make-runner.build" preLaunchTask which could cause crashes.

### 0.1.1

Fixed "Cargo Make/Build" output channel not being reused, bloating output panel.

### 0.1.0

Initial release. bau bau

## Todo

* Makefile.toml task selection
* Allow target selection to include example binaries
* Running of tests

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
