import * as vscode from 'vscode';
import * as cmakeToolsApi from 'vscode-cmake-tools';


async function getBuildDir() {
  let cmakeTools = await cmakeToolsApi.getCMakeToolsApi(cmakeToolsApi.Version.v1);
  if (!cmakeTools) {
    vscode.window.showErrorMessage('Could not find CMakeTools extensions');
    return;
  }
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  let project = await cmakeTools.getProject(workspaceFolders[0].uri);
  if (!project) {
    vscode.window.showErrorMessage('Could not find any CMake project in the workspace root directory');
    return;
  }

  return project.getBuildDirectory();
}

export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.commands.registerCommand('clangd-cmake.restart-clangd', () => {
    let cmakeTools = cmakeToolsApi.getCMakeToolsApi(cmakeToolsApi.Version.v1);

    getBuildDir().then(buildDir => {

      if (!buildDir) {
        vscode.window.showErrorMessage('Could not find any build dir.');
        return;
      }
      const config = vscode.workspace.getConfiguration('clangd');
      config.update('arguments', ["--compile-commands-dir=" + buildDir], vscode.ConfigurationTarget.Workspace);
      setTimeout(() => {
        vscode.window.showInformationMessage('Active configuration updated. Restarting clangd with new compilation database');
        vscode.commands.executeCommand('clangd.restart');
      }, 2000);
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }
