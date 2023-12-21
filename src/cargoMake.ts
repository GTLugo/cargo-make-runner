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

    this.workspaceData = new WorkspaceData(context);
    this.statusBarButtons = new StatusBarButtons(context, this.workspaceData);

    this.registerCommands(context, rootPath);
    this.provideTasks(context, rootPath);
    this.workspaceData.findTomlProjects(rootPath);
  }

  // This method is called when my extension is deactivated
  deactivate(): void {

  }

  registerCommands(context: vscode.ExtensionContext, rootPath: string): void {
    context.subscriptions.push(vscode.commands.registerCommand(refreshCmdID, () => {
      this.workspaceData.findTomlProjects(rootPath);
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
      let workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  
      this.outputChannel.clear();
      this.outputChannel.show();
      
      // run your cargo make command
      let cargoCmd = child_process.spawn(
        'cargo', 
        ['make', '--profile', this.workspaceData.selectedProfile, 'build'], 
        { cwd: workspaceFolder, shell: true }
      );
  
      cargoCmd.stdout.on('data', (data) => {
        this.outputChannel.append(data.toString());
      });
  
      cargoCmd.stderr.on('data', (data) => {
        this.outputChannel.append(data.toString());
      });
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand(debugCmdID, async () => {
      let workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  
      this.outputChannel.clear();
      this.outputChannel.show();
      
      // run your cargo make command
      let cargoCmd = child_process.spawn(
        'cargo', 
        ['make', '--profile', this.workspaceData.selectedProfile, 'build'], 
        { cwd: workspaceFolder, shell: true }
      );
  
      cargoCmd.stdout.on('data', (data) => {
        this.outputChannel.append(data.toString());
      });
  
      cargoCmd.stderr.on('data', (data) => {
        this.outputChannel.append(data.toString());
      });
  
      cargoCmd.on('close', (code) => {
        // Start debugging here if code is 0 (success)
        if (code === 0) {
          vscode.debug.startDebugging(undefined, this.workspaceData.getCargoDebugConfiguration(rootPath));
        }
      });
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand(runCmdID, async () => {
      let workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  
      this.outputChannel.clear();
      this.outputChannel.show();
      
      // run your cargo make command
      let cargoCmd = child_process.spawn(
        'cargo', 
        ['make', '--profile', this.workspaceData.selectedProfile, 'build'], 
        { cwd: workspaceFolder, shell: true }
      );
  
      cargoCmd.stdout.on('data', (data) => {
        this.outputChannel.append(data.toString());
      });
  
      cargoCmd.stderr.on('data', (data) => {
        this.outputChannel.append(data.toString());
      });
  
      cargoCmd.on('close', async (code) => {
        // Start debugging here if code is 0 (success)
        if (code === 0) {
          const runTask = vscode.tasks.fetchTasks().then(tasks => {
            const task = tasks.find(task => task.name === runCmdID);
            if (!task) { 
              throw new Error('Run task not found'); 
            }
            return task;
          });

          vscode.tasks.executeTask(await runTask);
        }
      });
    }));
  }

  provideTasks(context: vscode.ExtensionContext, rootPath: string): void {
    const debugConfig = this.workspaceData.getCargoDebugConfiguration(rootPath);

    context.subscriptions.push(vscode.tasks.registerTaskProvider('shell', {
      provideTasks: () => {
        let taskRun = new vscode.Task(
          {type: 'shell'}, 
          vscode.TaskScope.Workspace,
          runCmdID, 
          'Rust', 
          new vscode.ShellExecution(debugConfig.program + " " + this.workspaceData.settings.get("additionalArgs"))
        );

        taskRun.presentationOptions = {
          clear: this.workspaceData.settings.get("clearRunTaskTerminal")
        };
  
        return [taskRun];
      },
      resolveTask(_task: vscode.Task): vscode.Task | undefined {
        return undefined;
      }
    }));
  }
}
