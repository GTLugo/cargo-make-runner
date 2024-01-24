import * as vscode from 'vscode';
import { WorkspaceData } from './extension/workspaceData';
import { buildCmdID, debugCmdID, profileCmdID, refreshCmdID, runCmdID, targetCmdID } from './extension/commandIds';
import { StatusBarButtons } from './extension/statusBar';
import * as child_process from 'child_process';

export class CargoMake {
  workspaceData: WorkspaceData;
  statusBarButtons: StatusBarButtons;
  outputChannel: vscode.OutputChannel;

  // This method is called when my extension is activated
  constructor(context: vscode.ExtensionContext, rootPath: string) {
    this.outputChannel = vscode.window.createOutputChannel('Cargo Make/Build');

    this.workspaceData = new WorkspaceData(context, rootPath);
    this.statusBarButtons = new StatusBarButtons(context, this.workspaceData);

    this.registerCommands(context, rootPath);
    this.provideTasks(context, rootPath);
  }

  // This method is called when my extension is deactivated
  deactivate(): void {

  }

  registerCommands(context: vscode.ExtensionContext, rootPath: string): void {
    context.subscriptions.push(vscode.commands.registerCommand(refreshCmdID, () => {
      this.workspaceData.targets = this.workspaceData.findTomlProjects(rootPath);
    }));

    context.subscriptions.push(vscode.commands.registerCommand(targetCmdID, async () => {
      if (this.workspaceData.targets.length === 0) {
        vscode.window.showErrorMessage("No workspace targets found");
        this.statusBarButtons.updateTargetLabel(this.workspaceData.selectedTarget);
        return;
      }

      const input = await vscode.window.showQuickPick(
        this.workspaceData.targets,
        {
          canPickMany: false,
          title: "Cargo Make Target",
          placeHolder: this.workspaceData.selectedTarget === undefined ? "None" : this.workspaceData.selectedTarget,
        }
      );

      if (input !== undefined) {
        this.workspaceData.selectedTarget = input;
        context.workspaceState.update("selectedTarget", this.workspaceData.selectedTarget);
        this.statusBarButtons.updateTargetLabel(this.workspaceData.selectedTarget);
      }
    }));

    context.subscriptions.push(vscode.commands.registerCommand(profileCmdID, async () => {
      const input = await vscode.window.showQuickPick(
        ["development", "release"],
        {
          canPickMany: false,
          title: "Cargo Make Profile",
          placeHolder: this.workspaceData.selectedProfile,
        }
      );

      if (input !== undefined) {
        this.workspaceData.selectedProfile = input;
        context.workspaceState.update("selectedProfile", this.workspaceData.selectedProfile);
        this.statusBarButtons.updateProfileLabel(this.workspaceData.selectedProfile);
      }
    }));

    context.subscriptions.push(vscode.commands.registerCommand(buildCmdID, async () => {
      this.cargoMakeBuild(rootPath);
    }));

    context.subscriptions.push(vscode.commands.registerCommand(debugCmdID, async () => {
      let cargoCmd = this.cargoMakeBuild(rootPath);

      cargoCmd.on('close', (code) => {
        // Start debugging here if code is 0 (success)
        if (code === 0) {
          vscode.debug.startDebugging(undefined, this.workspaceData.getCargoDebugConfiguration(rootPath));
        }
      });
    }));

    context.subscriptions.push(vscode.commands.registerCommand(runCmdID, async () => {
      let cargoCmd = this.cargoMakeBuild(rootPath);

      cargoCmd.on('close', async (code) => {
        // Start debugging here if code is 0 (success)
        if (code === 0) {
          const runTask = vscode.tasks.fetchTasks().then(tasks => {
            const taskName = runCmdID + "_" + this.workspaceData.selectedProfile;
            const task = tasks.find(task => task.name === taskName);
            if (!task) {
              throw new Error('Run task `' + taskName + '` not found');
            }
            return task;
          });

          vscode.tasks.executeTask(await runTask);
        }
      });
    }));
  }

  provideTasks(context: vscode.ExtensionContext, rootPath: string): void {
    context.subscriptions.push(vscode.tasks.registerTaskProvider('shell', {
      provideTasks: () => {
        let taskRunRelease = new vscode.Task(
          { type: 'shell' },
          vscode.TaskScope.Workspace,
          runCmdID + "_release",
          'Rust',
          new vscode.ShellExecution(`${this.workspaceData.getTargetPath(rootPath, "release")} ${this.workspaceData.settings.get("additionalArgs")}`)
        );

        taskRunRelease.presentationOptions = {
          clear: this.workspaceData.settings.get("clearRunTaskTerminal")
        };

        let taskRunDebug = new vscode.Task(
          { type: 'shell' },
          vscode.TaskScope.Workspace,
          runCmdID + "_development",
          'Rust',
          new vscode.ShellExecution(`${this.workspaceData.getTargetPath(rootPath, "debug")} ${this.workspaceData.settings.get("additionalArgs")}`)
        );

        taskRunDebug.presentationOptions = {
          clear: this.workspaceData.settings.get("clearRunTaskTerminal")
        };

        return [taskRunRelease, taskRunDebug];
      },
      resolveTask(_task: vscode.Task): vscode.Task | undefined {
        return undefined;
      }
    }));
  }

  cargoMakeBuild(rootPath: string): child_process.ChildProcessWithoutNullStreams {
    this.outputChannel.clear();
    this.outputChannel.show();

    let target = this.workspaceData.getTrimmedTarget() ?? "";

    let cmd: string[];
    if (this.workspaceData.selectedProfile === "release") {
      cmd = [
        'make',
        '--profile',
        this.workspaceData.selectedProfile,
        'build-release',
        "-e",
        `CARGO_MAKE_RUN_TARGET=${target}`,
        "-e",
        `CARGO_MAKE_RUN_IS_EXAMPLE=${(this.workspaceData.isSelectedExample() ? `--example ${target}` : '')}`
      ];
    } else {
      cmd = [
        'make',
        '--profile',
        this.workspaceData.selectedProfile,
        'build',
        "-e",
        `CARGO_MAKE_RUN_TARGET=${target}`,
        "-e",
        `CARGO_MAKE_RUN_IS_EXAMPLE=${(this.workspaceData.isSelectedExample() ? `--example ${target}` : '')}`
      ];
    }
    let cargoCmd = child_process.spawn('cargo', cmd, { cwd: rootPath, shell: true });

    cargoCmd.stdout.on('data', (data) => {
      this.outputChannel.append(data.toString());
    });

    cargoCmd.stderr.on('data', (data) => {
      this.outputChannel.append(data.toString());
    });

    return cargoCmd;
  }
}
