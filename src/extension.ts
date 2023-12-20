// https://github.com/microsoft/vscode-extension-samples/tree/main/statusbar-sample

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as assert from 'assert';
import { CargoMake } from './cargoMake';

let cargoMake: CargoMake;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('HELLO HELLO');

  const rootPath = workspaceRootPath();
  if (rootPath === undefined) {
    vscode.window.showErrorMessage('Failed to find workspace');
    return;
  }
  assert(rootPath !== undefined);

  cargoMake = new CargoMake(context, rootPath);

	console.log('BAU BAU');
}

function workspaceRootPath(): string | undefined {
  return (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("BAU BAU FOR NOW");

  cargoMake.deactivate();

	console.log('BAU BAU');
}
