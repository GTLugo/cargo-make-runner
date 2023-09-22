// https://github.com/microsoft/vscode-extension-samples/tree/main/statusbar-sample

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as toml from 'toml';
import * as path from 'path';
import assert = require('assert');
import * as child_process from 'child_process';

const refreshCmdID = 'cargo-make-runner.refresh';
const targetCmdID = 'cargo-make-runner.target';
const profileCmdID = 'cargo-make-runner.profile';
const buildCmdID = 'cargo-make-runner.build';
const runCmdID = 'cargo-make-runner.run';
const debugCmdID = 'cargo-make-runner.debug';

// TODO: stop buttons for debugger and runner
let refreshStatusBar: vscode.StatusBarItem;
let targetStatusBar: vscode.StatusBarItem;
let profileStatusBar: vscode.StatusBarItem;
let buildStatusBar: vscode.StatusBarItem;
let runStatusBar: vscode.StatusBarItem;
let debugStatusBar: vscode.StatusBarItem;

let outputChannel: vscode.OutputChannel;
let workspaceTargets: string[] = [];

// Persistent state
let selectedProfile: string;
let selectedTarget: string | undefined;
let selectedIsExample: boolean;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('HELLO HELLO');

  outputChannel = vscode.window.createOutputChannel('Cargo Make/Build');

  selectedProfile = context.workspaceState.get("selectedProfile", "development");
  selectedTarget = context.workspaceState.get("selectedTarget", undefined);
  selectedIsExample = context.workspaceState.get("selectedIsExample", false);

  findTomlProjects();

  registerCommands(context);
  provideTasks(context);
  createStatusBarItems(context);

	console.log('BAU BAU');
}

function registerCommands(context: vscode.ExtensionContext): void {
	context.subscriptions.push(vscode.commands.registerCommand(refreshCmdID, () => {
    findTomlProjects();
  }));

	context.subscriptions.push(vscode.commands.registerCommand(targetCmdID, async () => {
    if (workspaceTargets.length === 0) {
      vscode.window.showErrorMessage("No workspace targets found");
      updateTargetLabel();
      return;
    }
  
    const input = await vscode.window.showQuickPick(
      workspaceTargets,
      {
        canPickMany: false,
        title: "Cargo Make Target",
        placeHolder: selectedTarget === undefined ? "None" : selectedTarget,
      }
    );
  
    if (input !== undefined) {
      selectedTarget = input;
      context.workspaceState.update("selectedTarget", selectedTarget);
      updateTargetLabel();
    }
  }));

	context.subscriptions.push(vscode.commands.registerCommand(profileCmdID, async () => {
    const input = await vscode.window.showQuickPick(
      ["development", "release"],
      {
        canPickMany: false,
        title: "Cargo Make Profile",
        placeHolder: selectedProfile,
      }
    );
  
    if (input !== undefined) {
      selectedProfile = input;
      context.workspaceState.update("selectedProfile", selectedProfile);
      updateProfileLabel();
      // vscode.window.showInformationMessage('Cargo Make: Selected profile `' + makeProfile + '`');
    }
  }));
  
  context.subscriptions.push(vscode.commands.registerCommand(buildCmdID, async () => {
    const buildTask = vscode.tasks.fetchTasks().then(tasks => {
      const task = tasks.find(task => task.name === buildCmdID);
      if (!task) { 
        throw new Error('Build task not found'); 
      }
      return task;
    });

    vscode.tasks.executeTask(await buildTask);
  }));
  
  context.subscriptions.push(vscode.commands.registerCommand(runCmdID, async () => {
    const runTask = vscode.tasks.fetchTasks().then(tasks => {
      const task = tasks.find(task => task.name === runCmdID);
      if (!task) { 
        throw new Error('Run task not found'); 
      }
      return task;
    });

    vscode.tasks.executeTask(await runTask);
  }));
  
  context.subscriptions.push(vscode.commands.registerCommand(debugCmdID, async () => {
    let workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    outputChannel.clear();
    outputChannel.show();
    
    // run your cargo make command
    let cargoCmd = child_process.spawn(
      'cargo', 
      ['make', '--profile', selectedProfile, 'build'], 
      { cwd: workspaceFolder, shell: true }
    );

    cargoCmd.stdout.on('data', (data) => {
      outputChannel.append(data.toString());
    });

    cargoCmd.stderr.on('data', (data) => {
      outputChannel.append(data.toString());
    });

    cargoCmd.on('close', (code) => {
      // Start debugging here if code is 0 (success)
      if (code === 0) {
        vscode.debug.startDebugging(undefined, getCargoDebugConfiguration());
      }
    });
  }));
}

function provideTasks(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.tasks.registerTaskProvider('shell', {
    provideTasks: () => {
      const bin = selectedTarget === undefined ? '' : selectedTarget;
      let taskBuild = new vscode.Task(
        {type: 'shell'}, 
        vscode.TaskScope.Workspace, 
        buildCmdID, 
        'Rust', 
        new vscode.ShellExecution("cargo make " + "--profile " + selectedProfile + " -e CARGO_MAKE_RUN_TARGET=" + bin + " build")
      );
      let taskRun = new vscode.Task(
        {type: 'shell'}, 
        vscode.TaskScope.Workspace,
        runCmdID, 
        'Rust', 
        new vscode.ShellExecution("cargo make " + "--profile " + selectedProfile + " -e CARGO_MAKE_RUN_TARGET=" + bin + " run")
      );

      return [taskBuild, taskRun];
    },
    resolveTask(_task: vscode.Task): vscode.Task | undefined {
      return undefined;
    }
  }));
}

function createStatusBarItems(context: vscode.ExtensionContext): void {
  refreshStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.5);
  refreshStatusBar.text = "$(refresh)";
  refreshStatusBar.tooltip = "Cargo Make: Refresh Targets List";
  refreshStatusBar.command = refreshCmdID;
  context.subscriptions.push(refreshStatusBar);
  refreshStatusBar.show();

  targetStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.4);
  updateTargetLabel();
  targetStatusBar.tooltip = "Cargo Make: Select Target";
  targetStatusBar.command = targetCmdID;
  context.subscriptions.push(targetStatusBar);
  targetStatusBar.show();

  profileStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.3);
  updateProfileLabel();
  profileStatusBar.tooltip = "Cargo Make: Select Profile";
  profileStatusBar.command = profileCmdID;
  context.subscriptions.push(profileStatusBar);
  profileStatusBar.show();

  buildStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.2);
  buildStatusBar.text = "$(tools)";
  buildStatusBar.tooltip = "Cargo Make: Build";
  buildStatusBar.command = buildCmdID;
  context.subscriptions.push(buildStatusBar);
  buildStatusBar.show();

  runStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.1);
  runStatusBar.text = "$(run)";
  runStatusBar.tooltip = "Cargo Make: Run";
  runStatusBar.command = runCmdID;
  context.subscriptions.push(runStatusBar);
  runStatusBar.show();

  debugStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
  debugStatusBar.text = "$(debug)";
  debugStatusBar.tooltip = "Cargo Make: Debug";
  debugStatusBar.command = debugCmdID;
  context.subscriptions.push(debugStatusBar);
  debugStatusBar.show();
}

function updateTargetLabel(): void {
  if (selectedTarget === undefined) {
    targetStatusBar.text = "Target: None";
  } else {
    targetStatusBar.text = "Target: " + selectedTarget;
  }
}

function updateProfileLabel(): void {
  if (selectedProfile === undefined) {
    profileStatusBar.text = "Profile: None";
  } else {
    profileStatusBar.text = "Profile: " + selectedProfile;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Bau Bau for now");
}

function getCargoDebugConfiguration(): vscode.DebugConfiguration {

  let debugType: string | undefined;
  if (process.platform === 'win32') {
    debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debugger_type_windows');
  } else if (process.platform === 'darwin') {
    debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debugger_type_mac');
  } else {
    debugType = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.debugger_type_linux');
  } 

  if (debugType === undefined) {
    debugType = 'lldb';
  }

  let binaryExtension = process.platform === 'win32' ? '.exe' : '';
  
  assert(vscode.workspace.workspaceFolders !== undefined);
  let workspaceFolder = vscode.workspace.workspaceFolders.at(0)?.uri.fsPath;
  assert(workspaceFolder !== undefined);

  let profile: string;
  if (selectedProfile === "release") {
    profile = "release";
  } else {
    profile = "debug";
  }

  let targetDir = vscode.workspace.getConfiguration().get<string>('cargo_make_runner.target_directory');
  if (targetDir === undefined) {
    targetDir = 'target';
  }
  
  const targetBin = path.join(workspaceFolder, targetDir, profile, selectedTarget + binaryExtension);

  const mode = selectedProfile === "release" ? "--release" : "";

  return {
    type: debugType,
    request: 'launch',
    name: 'cargo debug',
    program: targetBin,
    args: ['run', mode],
    cwd: '${workspaceFolder}',
  };
}

// TODO: add a refresh button
function findTomlProjects(): void  {
  if (vscode.workspace.workspaceFolders === undefined) {
    vscode.window.showErrorMessage('Failed to find workspace');
    return;
  }

  let workspace = vscode.workspace.workspaceFolders.at(0)?.uri.fsPath;
  if (workspace === undefined) {
    vscode.window.showErrorMessage('Failed to find workspace');
    return;
  }
  // console.log("Workspace: " + workspace);

  let cargoTomlPath = path.resolve(workspace, 'Cargo.toml');
  let cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');

  let cargoToml = toml.parse(cargoTomlContent);
  // console.log("Top-level TOML: ");
  console.log(cargoToml);

  workspaceTargets.length = 0; // clear array to prepare for updating
  if (cargoToml.package && cargoToml.package.name) {
    // Single Cargo.toml
    if (cargoToml.bin) {
      for (const bin of cargoToml.bin) {
        if(bin.name) {
          workspaceTargets.push(bin.name);
        }
      }
    } else {
      const pathToMain = path.join(workspace, 'src', 'main.rs');
      if (fs.existsSync(pathToMain)) {
        workspaceTargets.push(cargoToml.package.name);
      }
    }
  } else if (cargoToml.workspace && cargoToml.workspace.members) {
    // Workspace
    for (const member of cargoToml.workspace.members) {
      const memberPath = path.resolve(workspace, member, 'Cargo.toml');
      const memberTomlContent = fs.readFileSync(memberPath, 'utf8');
      const memberToml = toml.parse(memberTomlContent);
      if (memberToml.bin) {
        for (const bin of memberToml.bin) {
          if(bin.name) {
            workspaceTargets.push(bin.name);
          }
        }
      } else {
        const pathToMain = path.join(workspace, member, 'src', 'main.rs');
        if (fs.existsSync(pathToMain)) {
          workspaceTargets.push(memberToml.package.name);
        }
      }
    }
  } else {
    vscode.window.showErrorMessage('Unsupported TOML configuration. TOML must include a [package] section with a name field for single crates or a [workspace] section with members for workspaces.');
  }

  // console.log("Members: ");
  // console.log(workspaceTargets);

  if (selectedTarget === undefined) {
    selectedTarget = workspaceTargets.at(0);
  }
}