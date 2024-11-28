import * as vscode from 'vscode';
import * as cmakeToolsApi from 'vscode-cmake-tools';


async function getProject() {
  let cmakeTools = await cmakeToolsApi.getCMakeToolsApi(cmakeToolsApi.Version.v1);
  if (!cmakeTools) {
    vscode.window.showErrorMessage('Could not find CMakeTools extensions');
    return;
  }
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  return cmakeTools.getProject(workspaceFolders[0].uri);
}


async function getBuildDir() {
  let project = await getProject();
  if (!project) {
    vscode.window.showErrorMessage('Could not find any CMake project in the workspace root directory');
    return;
  }


  return project.getBuildDirectory();
}

export function activate(context: vscode.ExtensionContext) {
  getProject().then(project => {
    if (project) {
      project.onSelectedConfigurationChanged(type => {
        vscode.commands.executeCommand('clangd-cmake.restart-clangd');
      });
    }
  });

  const disposable = vscode.commands.registerCommand('clangd-cmake.restart-clangd', () => {

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
