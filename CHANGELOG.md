# Release Notes

All notable changes to the "cargo-make-runner" extension will be documented in this file.

## [0.2.4]

### Changed
- Clarifications made to README.

## [0.2.3]

### Fixed
- Bug where sometimes the target wouldn't be properly assigned until window was reloaded.

## [0.2.2]

### Changed
- Switched to changelog file.

## [0.2.1]

### Added
- `cargo_make_runner.clearRunTaskTerminal`.

## [0.2.0]

### Changed
- Finally refactored project files for better structuring.
- Adjusted status bar icons to mimic the CMake extension.
- All build output for each run option goes into Output panel.
- Run button now no longer depends on a `run` task in the `Makefile.toml`.

### Added
- Provides `CARGO_MAKE_RUN_TARGET` cargo-make environment variable which is set to the currently selected target.
- `cargo_make_runner.useCompactIcons`.
- `cargo_make_runner.additionalArgs`.
- Began implementation for tree view section (not implemented in this version).

### Fixed
- Targets section no longer lists targets which don't include `[[bin]]` or `src/main.rs`.

## [0.1.2]

### Fixed 
- Erroneous "cargo-make-runner.build" preLaunchTask which would cause crashes.

## [0.1.1]

### Fixed 
- "Cargo Make/Build" output channel not being reused, bloating output panel.

## [0.1.0]
- Initial release. bau bau