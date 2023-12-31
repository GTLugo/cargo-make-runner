import * as vscode from 'vscode';
import * as fs from 'fs';
import * as toml from 'toml';
import * as path from 'path';

export class WorkspaceData {
  targets: string[] = [];
  selectedTarget: string | undefined;
  selectedProfile: string;
  selectedIsExample: boolean;

  settings: vscode.WorkspaceConfiguration;

  constructor(context: vscode.ExtensionContext, rootPath: string) {
    this.settings = vscode.workspace.getConfiguration("cargo_make_runner");

    this.selectedTarget = context.workspaceState.get("selectedTarget", undefined);
    this.selectedIsExample = context.workspaceState.get("selectedIsExample", false);
    this.selectedProfile = context.workspaceState.get("selectedProfile", "development");
    
    this.findTomlProjects(rootPath);
  }

  findTomlProjects(rootPath: string): void  {
    let cargoTomlPath = path.resolve(rootPath, 'Cargo.toml');
    let cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');
  
    let cargoToml = toml.parse(cargoTomlContent);
  
    this.targets.length = 0; // clear array to prepare for updating
    if (cargoToml.package && cargoToml.package.name) {
      // Single Cargo.toml
      if (cargoToml.bin) {
        for (const bin of cargoToml.bin) {
          if(bin.name) {
            this.targets.push(bin.name);
          }
        }
      } else {
        const pathToMain = path.join(rootPath, 'src', 'main.rs');
        if (fs.existsSync(pathToMain)) {
          this.targets.push(cargoToml.package.name);
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
            if(bin.name) {
              this.targets.push(bin.name);
            }
          }
        } else {
          const pathToMain = path.join(rootPath, member, 'src', 'main.rs');
          if (fs.existsSync(pathToMain)) {
            this.targets.push(memberToml.package.name);
          }
        }
      }
    } else {
      vscode.window.showErrorMessage('Unsupported TOML configuration. TOML must include a [package] section with a name field for single crates or a [workspace] section with members for workspaces.');
    }
  
    if (this.selectedTarget === undefined) {
      this.selectedTarget = this.targets.at(0);
    }
  }

  getActiveTargetPath(rootPath: string): string {
    let profile: string;
    if (this.selectedProfile === "release") {
      profile = "release";
    } else {
      profile = "debug";
    }
    
    return this.getTargetPath(rootPath, profile);
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
    
    return path.join(rootPath, targetDir, profile, this.selectedTarget + binaryExtension);
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

    console.log(config);

    return config;
  }
}