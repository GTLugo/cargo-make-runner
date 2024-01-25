import * as vscode from 'vscode';
import * as fs from 'fs';
import * as toml from 'toml';
import * as path from 'path';

export class RustTarget {
  name: string = '';
  isExample: boolean;

  constructor(name: string, isExample: boolean = false) {
    this.name = name;
    this.isExample = isExample;
  }
}

export class WorkspaceData {
  targets: string[] = [];
  selectedTarget: string | undefined;
  selectedProfile: string;
  // selectedIsExample: boolean;

  settings: vscode.WorkspaceConfiguration;

  constructor(context: vscode.ExtensionContext, rootPath: string) {
    this.settings = vscode.workspace.getConfiguration("cargo_make_runner");

    // this.selectedIsExample = context.workspaceState.get("selectedIsExample", false);
    this.updateTargets(context, rootPath);
    this.selectedProfile = context.workspaceState.get("selectedProfile", "development");

    // testing
    // const workspaceName: string = path.basename(rootPath);
    // console.log(`${workspaceName}:`);
    // console.log('-----------------------------------');
    // let examples = this.findExamples(rootPath);

    // console.log(`Examples:`);
    // console.log('-----------------------------------');
    // console.log(examples);
    // console.log(`Binaries:`);
    // console.log('-----------------------------------');
    // console.log(this.targets);
  }

  updateTargets(context: vscode.ExtensionContext, rootPath: string) {
    this.targets = this.findTomlProjects(rootPath);
    
    let target: RustTarget | undefined = context.workspaceState.get("selectedTarget", undefined);
    if (target !== undefined && this.targets.includes(target)) {
      this.selectedTarget = target;
    } else {
      this.selectedTarget = this.targets.at(0);
    }
  }

  findTomlProjects(rootPath: string): string[] {
    let cargoTomlPath = path.resolve(rootPath, 'Cargo.toml');
    let cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');

    let cargoToml = toml.parse(cargoTomlContent);

    let targets: string[] = [];
    // this.targets.length = 0; // clear array to prepare for updating
    if (cargoToml.package && cargoToml.package.name) {
      // Single Cargo.toml
      if (cargoToml.bin) {
        for (const bin of cargoToml.bin) {
          if (bin.name) {
            targets.push(bin.name);
          }
        }
      } else {
        const pathToMain = path.join(rootPath, 'src', 'main.rs');
        if (fs.existsSync(pathToMain)) {
          targets.push(cargoToml.package.name);
        }
      }
    } else if (cargoToml.workspace && cargoToml.workspace.members) {
      // Workspace
      for (const member of cargoToml.workspace.members) {
        const memberPath = path.resolve(rootPath, member, 'Cargo.toml');
        const memberTomlContent = fs.readFileSync(memberPath, 'utf8');
        const memberToml = toml.parse(memberTomlContent);
        if (memberToml.bin) {
          for (const bin of memberToml.bin) {
            if (bin.name) {
              targets.push(bin.name);
            }
          }
        } else {
          const pathToMain = path.join(rootPath, member, 'src', 'main.rs');
          if (fs.existsSync(pathToMain)) {
            targets.push(memberToml.package.name);
          }
        }
      }
    } else {
      vscode.window.showErrorMessage('Unsupported TOML configuration. TOML must include a [package] section with a name field for single crates or a [workspace] section with members for workspaces.');
    }

    targets = targets.concat(this.findExamples(rootPath));

    // if (this.selectedTarget === undefined) {
    //   this.selectedTarget = this.targets.at(0);
    // }
    return targets;
  }

  findExamples(dir: string): string[] {
    const skippedDirs = ['target', '.git'];
    console.log(`dir: ${dir}`);
    const items: string[] = fs.readdirSync(dir);
    console.log(`items: ${items}`);

    let targets: string[] = [];
    for (let item of items) {
      let itemPath = path.join(dir, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      const crateRoot = items.includes('Cargo.toml');

      if (crateRoot && skippedDirs.includes(item)) {
        continue; // skip dirs which are entirely irrelevant and possibly erroneous
      }

      if (isDirectory) {
        if (item === 'examples') {
          const items: string[] = fs.readdirSync(itemPath);
          for (let item of items) {
            let exampleItemPath = path.join(itemPath, item);
            const isDirectory = fs.statSync(exampleItemPath).isDirectory();
            if (isDirectory) {
              console.log(`EXAMPLE: ${path.join(exampleItemPath, 'main.rs')}`);
              if (fs.existsSync(path.join(exampleItemPath, 'main.rs'))) {
                let fileContent = fs.readFileSync(path.join(exampleItemPath, 'main.rs'), 'utf-8');
                if (fileContent.includes('fn main')) {
                  targets.push(`${item} (example)`);
                }
              }
            } else {
              if (item.endsWith('.rs')) {
                let fileContent = fs.readFileSync(exampleItemPath, 'utf-8');
                if (fileContent.includes('fn main')) {
                  targets.push(`${item.substring(0, item.length - 3)} (example)`);
                }
              }
            }
          }
        }
        targets = targets.concat(this.findExamples(itemPath));
      }
    }

    return targets;
  }

  // findExamplesRecursive(dir: string): string[] {
  //   const items: string[] = fs.readdirSync(dir);

  //   let targets: string[] = [];
    
  //   for (let item of items) {
  //     let itemPath = path.join(dir, item);
  //     if (fs.statSync(itemPath).isDirectory()) {
  //       targets = targets.concat(this.findExamplesRecursive(itemPath));
  //     }

  //     console.log(item);
  //   }

  //   return targets;
  // }

  getActiveTargetPath(rootPath: string): string {
    let profile: string;
    if (this.selectedProfile === "release") {
      profile = "release";
    } else {
      profile = "debug";
    }

    return this.getTargetPath(rootPath, profile);
  }

  isSelectedExample(): boolean {
    const example = ' (example)';
    if (this.selectedTarget?.endsWith(example)) {
      return true;
    } else {
      return false;
    }
  }

  getTrimmedTarget(): string | undefined {
    const example = ' (example)';
    if (this.selectedTarget?.endsWith(example)) {
      return this.selectedTarget.substring(0, this.selectedTarget.length - example.length);
    } else {
      return this.selectedTarget;
    }
  }

  getTargetPath(rootPath: string, profile: string): string {
    let debugType: string | undefined;
    if (process.platform === 'win32') {
      debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debuggerTypeWindows');
    } else if (process.platform === 'darwin') {
      debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debuggerTypeMac');
    } else {
      debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debuggerTypeLinux');
    }

    if (debugType === undefined) {
      debugType = 'lldb';
    }

    let binaryExtension = process.platform === 'win32' ? '.exe' : '';

    let targetDir = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.targetDirectory', 'target');

    let example = "";
    if (this.isSelectedExample()) {
      example = "examples";
    }

    return path.join(rootPath, targetDir, profile, example, this.getTrimmedTarget() + binaryExtension);
  }

  getCargoDebugConfiguration(rootPath: string): vscode.DebugConfiguration {
    let debugType: string | undefined;
    if (process.platform === 'win32') {
      debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debuggerTypeWindows', 'lldb');
    } else if (process.platform === 'darwin') {
      debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debuggerTypeMac', 'lldb');
    } else {
      debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debuggerTypeLinux', 'lldb');
    }

    const targetBin = this.getActiveTargetPath(rootPath);

    let config = {
      type: debugType,
      request: 'launch',
      name: 'debug: ' + this.selectedTarget,
      program: targetBin,
      args: this.settings.get("additionalArgs"),
      cwd: '${workspaceFolder}',
    };

    // console.log(config);

    return config;
  }
}