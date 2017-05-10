'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function dirContent(rootPath: string, dirPath: string) : Promise<string[]> {
  return new Promise((resolve: Function, reject: Function) => {

    const basePath = path.join(rootPath, dirPath);

    fs.readdir(basePath, (err, files) => {
      if (err) { return reject(err); }
      resolve(files
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

function showDirContent(rootPath: string, dirPath: string) {
  dirContent(rootPath, dirPath)
    .then((paths) => vscode.window.showQuickPick((paths), { placeHolder: dirPath }))
    .then((selection: string | undefined) => {
      if (!selection) { return; }

      if (selection.match(/\/$/)) {
        showDirContent(rootPath, selection)
      } else {
        openFile(path.join(rootPath, selection))
      }
    })
}

function showQuickPick(choices: Promise<string[]>) {
  return vscode.window.showQuickPick((choices), {
    placeHolder: 'Select File'
  });
}

function openFile(filePath: string) {
  const fileUri = vscode.Uri.parse(`file://${filePath}`) ;
  vscode.workspace.openTextDocument(fileUri)
    .then((doc) => vscode.window.showTextDocument(doc))
    // .catch((error) => vscode.window.showErrorMessage(error.message))
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('extension.showFileNavigator', () => {
    const { rootPath } = vscode.workspace;
    showDirContent(rootPath, '')
  });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}