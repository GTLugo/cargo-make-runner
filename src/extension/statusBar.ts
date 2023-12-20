import * as vscode from 'vscode';
import { buildCmdID, debugCmdID, profileCmdID, refreshCmdID, runCmdID, targetCmdID } from './commandIds';
import { WorkspaceData } from './workspaceData';

export class StatusBarButtons {
  refreshButton: vscode.StatusBarItem;
  targetButton: vscode.StatusBarItem;
  profileButton: vscode.StatusBarItem;
  buildStatusBar: vscode.StatusBarItem;
  runStatusBar: vscode.StatusBarItem;
  debugStatusBar: vscode.StatusBarItem;

  settings: vscode.WorkspaceConfiguration;

  constructor(context: vscode.ExtensionContext, workspaceData: WorkspaceData) {
    this.settings = vscode.workspace.getConfiguration("cargo_make_runner");

    this.refreshButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.5);
    this.refreshButton.text = "$(refresh)";
    this.refreshButton.tooltip = "Cargo Make: Refresh Targets List";
    this.refreshButton.command = refreshCmdID;
    context.subscriptions.push(this.refreshButton);
    // this.refreshButton.show();

    this.profileButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.4);
    this.updateProfileLabel(workspaceData.selectedProfile);
    this.profileButton.command = profileCmdID;
    context.subscriptions.push(this.profileButton);
    this.profileButton.show();

    this.targetButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.3);
    this.updateTargetLabel(workspaceData.selectedTarget);
    this.targetButton.command = targetCmdID;
    context.subscriptions.push(this.targetButton);
    this.targetButton.show();

    this.buildStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.2);
    this.buildStatusBar.text = "$(gear) Build";
    this.buildStatusBar.tooltip = "Cargo Make: Build";
    this.buildStatusBar.command = buildCmdID;
    context.subscriptions.push(this.buildStatusBar);
    this.buildStatusBar.show();
  
    this.debugStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1.1);
    this.debugStatusBar.text = "$(bug)";
    this.debugStatusBar.tooltip = "Cargo Make: Debug";
    this.debugStatusBar.command = debugCmdID;
    context.subscriptions.push(this.debugStatusBar);
    this.debugStatusBar.show();
  
    this.runStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    this.runStatusBar.text = "$(run)";
    this.runStatusBar.tooltip = "Cargo Make: Run";
    this.runStatusBar.command = runCmdID;
    context.subscriptions.push(this.runStatusBar);
    this.runStatusBar.show();
  }
  
  // updateLabels(workspaceData: WorkspaceData): void {
  //   this.updateTargetLabel(workspaceData.selectedTarget);
  //   this.updateProfileLabel(workspaceData.selectedProfile);
  // }
  
  updateTargetLabel(selectedTarget: string | undefined): void {
    this.targetButton.tooltip = "Cargo Make Target: " + (selectedTarget ?? "");
    if (this.settings.get("useCompactIcons")) {
      this.targetButton.text = "$(tools)";
    } else {
      this.targetButton.text = "Target: " + (selectedTarget ?? "");
    }
  }

  updateProfileLabel(selectedProfile: string | undefined): void {
    this.profileButton.tooltip = "Cargo Make Profile: " + (selectedProfile ?? "");
    if (this.settings.get("useCompactIcons")) {
      this.profileButton.text = "$(info)";
    } else {
      this.profileButton.text = "Profile: " + (selectedProfile ?? "");
    }
  }
}