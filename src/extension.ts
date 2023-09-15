// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { main } from "./tailwind-prefixer";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "tailwind-prefixer" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "tailwind-prefixer.prefix",
    async () => {
      const options: vscode.OpenDialogOptions = {
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: "Select root directory",
      };
      const rootDirUri = await vscode.window.showOpenDialog(options);

      if (!rootDirUri) {
        return;
      }

      const rootDirPath = rootDirUri[0].fsPath;
      await main(rootDirPath);
      vscode.window.showInformationMessage("Tailwind prefixing complete!");
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
