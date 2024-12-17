import * as vscode from "vscode";
import { game1_levels } from "./levels/game1";

let sandboxDocument: undefined | vscode.TextDocument;
let currentLevel = 0;
let currentListener: undefined | vscode.Disposable;
let games = [game1_levels];
function addLevelHeader(content: string, level: number): string {
  return `Level ${level}:\n${content}`;
}
function getGameLevel(game: number) {
  return addLevelHeader(games[game][currentLevel], currentLevel);
}
async function changeSandboxContent(
  content: string
): Promise<vscode.TextEditor> {
  if (!sandboxDocument) {
    sandboxDocument = await vscode.workspace.openTextDocument({
      content: content,
      language: "plaintext",
    });
  }
  const editor = await vscode.window.showTextDocument(sandboxDocument);
  editor.edit(async (editBuilder) => {
    if (!sandboxDocument) return;
    const entireRange = new vscode.Range(
      sandboxDocument.positionAt(0),
      sandboxDocument.positionAt(sandboxDocument.getText().length)
    );
    editBuilder.replace(entireRange, content);
  });
  let line = 0;
  let char = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] == "s") {
      break;
    }
    char += 1;
    if (content[i] == "\n") {
      line += 1;
      char = 0;
    }
  }
  let newCursorPos = new vscode.Position(line, char);
  editor.selection = new vscode.Selection(newCursorPos, newCursorPos);
  await editor.revealRange(
    new vscode.Range(0, 0, 0, 0),
    vscode.TextEditorRevealType.AtTop
  );
  return editor;
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "vim-exercises.helloWorld",
    async () => {
      currentLevel = 0;
      let editor = await changeSandboxContent(getGameLevel(0));
      if (currentListener) {
        currentListener.dispose();
      }
      currentListener = vscode.window.onDidChangeTextEditorSelection(
        async (event) => {
          if (!sandboxDocument) return;
          if (event.textEditor.document != sandboxDocument) return;
          const cursorPosition = editor.selection.active;
          const lineText = sandboxDocument.lineAt(cursorPosition.line).text;
          const charUnderCursor = lineText[cursorPosition.character];
          if (charUnderCursor == "*") {
            currentLevel = 0;
            editor = await changeSandboxContent(getGameLevel(0));
          } else if (charUnderCursor == "e") {
            currentLevel += 1;
            if (currentLevel == game1_levels.length) {
              currentLevel = 0;
            }
            editor = await changeSandboxContent(getGameLevel(0));
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
