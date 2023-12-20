// TODO: Work on implementing this... Use vscode-cargo-scripts as reference for example of how to do views

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TaskTreeProvider implements vscode.TreeDataProvider<RunnerTask> {
  onDidChangeTreeData?: vscode.Event<void | RunnerTask | RunnerTask[] | null | undefined> | undefined;
  
  getTreeItem(element: RunnerTask): vscode.TreeItem | Thenable<vscode.TreeItem> {
    throw new Error('Method not implemented.');
  }
  getChildren(element?: RunnerTask | undefined): vscode.ProviderResult<RunnerTask[]> {
    throw new Error('Method not implemented.');
  }
  getParent?(element: RunnerTask): vscode.ProviderResult<RunnerTask> {
    throw new Error('Method not implemented.');
  }
  resolveTreeItem?(item: vscode.TreeItem, element: RunnerTask, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error('Method not implemented.');
  }
  
}

export class RunnerTask extends vscode.TreeItem {
  label: string;
  cmd: string;

  constructor(
    label: string, 
    cmd: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.label = label;
    this.cmd = cmd;
  }
}