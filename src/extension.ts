'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as minimatch from 'minimatch';

function testPatterns(path, patterns) {
  return !patterns.find((pattern) => minimatch(path, pattern));
}

function dirContent(rootPath: string, dirPath: string, ignorePatterns: string[]) : Promise<string[]> {
  return new Promise((resolve: Function, reject: Function) => {

    const basePath = path.join(rootPath, dirPath);

    fs.readdir(basePath, (err, files) => {
      if (err) { return reject(err); }
      resolve(files
        .filter((name) => testPatterns(path.join(dirPath, name), ignorePatterns))
        .map((name) => {
          name = path.join(dirPath, name)
          const stats = fs.statSync(path.join(rootPath, name))

          if (stats.isDirectory()) {
            name = `${name}/`
          }

          return name
        })
        .sort((a, b) => {
          const aIsDir = /\/$/.test(a)
          const bIsDir = /\/$/.test(b)

          if (aIsDir !== bIsDir) {
            return bIsDir ? 1 : -1;
          }

          return a.localeCompare(b);
        }))
    })
  })
}

function showDirContent(rootPath: string, dirPath: string, ignorePatterns: string[]) {

  if (dirPath === '.') {
    dirPath = ''
  }

  dirContent(rootPath, dirPath, ignorePatterns)
    .then((paths) => {

      const options = !dirPath ? paths : ['..', ...paths];

      return vscode.window.showQuickPick((options), { placeHolder: dirPath });
    })
    .then((selection: string | undefined) => {
      if (!selection) { return; }

      if (selection === '..') {
        showDirContent(rootPath, path.join(dirPath, selection), ignorePatterns)
      } else if (selection.match(/\/$/)) {
        showDirContent(rootPath, selection, ignorePatterns)
      } else {
        openFile(path.join(rootPath, selection))
      }
    })
}

function openFile(filePath: string) {
  const fileUri = vscode.Uri.parse(`file://${filePath}`) ;
  vscode.workspace.openTextDocument(fileUri)
    .then((doc) => vscode.window.showTextDocument(doc))
    // .catch((error) => vscode.window.showErrorMessage(error.message))
}

function ignores() {
  const configFilesExclude =
    vscode.workspace.getConfiguration('files.exclude');

  const workspaceIgnored = Object.keys(configFilesExclude)
    .filter(key => configFilesExclude[key]);

  return workspaceIgnored;
}

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('extension.showFileNavigator', () => {
    const { rootPath } = vscode.workspace;

    let dirPath = '';
    let ignorePatterns = ignores();
    if (vscode.window.activeTextEditor) {
      const { fileName } = vscode.window.activeTextEditor.document
      if (fileName.indexOf(rootPath) === 0) {
        dirPath = path.dirname(fileName.replace(`${rootPath}/`, ''))
      }
    }

    showDirContent(rootPath, dirPath, ignorePatterns)
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}