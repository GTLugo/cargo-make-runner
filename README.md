# cargo-make-runner

<a href='https://ko-fi.com/R6R8PGIU6' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />
<!-- [![ko-fi](vendor/kofi_button_blue.png)](https://ko-fi.com/R6R8PGIU6) -->

A quality-of-life plugin for users of [cargo-make](https://github.com/sagiegurari/cargo-make)

## Features

Target and profile selection, run and debug play buttons, build button, all in the status bar for convenience.
Provides `CARGO_MAKE_RUN_TARGET` cargo-make environment variable which is set to the currently selected target.
The extension will call the `build` task, so if there is no build task in the `Makefile.toml`, it will try to use the default `build` task (this is standard behavior for cargo-make).

> Note: This is still very much a WIP

## Requirements

* You must install [cargo-make](https://github.com/sagiegurari/cargo-make)
* You must have a `Makefile.toml` in the root directory of your workspace (it can be empty).

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

## Todo

* Makefile.toml task selection
* Allow target selection to include example binaries
* Running of tests

---

**Bau Bau!**
