import * as vscode from "vscode";
import { game0_levels } from "./levels/game0";

let sandboxDocument: undefined | vscode.TextDocument;
let currentLevel = 0;
let currentListener: undefined | vscode.Disposable;
let games = [game0_levels];
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}
function generateGame1Levels(levelsAmount: number, visibleLinesCount: number) {
  let gameLevels = [];
  for (let i = 0; i < levelsAmount; i++) {
    gameLevels.push(generateGame1Level(visibleLinesCount));
  }
  return gameLevels;
}
function generateGame1Level(visibleLinesCount: number): string {
  let levelContent = [];
  for (let i = 0; i < visibleLinesCount; i++) {
    levelContent.push("*\n");
  }
  let goalPosition = getRandomInt(visibleLinesCount);
  let startPosition = getRandomInt(visibleLinesCount);
  while (startPosition == goalPosition) {
    startPosition = getRandomInt(visibleLinesCount);
  }
  levelContent[goalPosition] = "e-----------------\n";
  levelContent[startPosition] = "s----------------\n";
  return levelContent.join("");
}
function addLevelHeader(content: string, level: number): string {
  return `Level ${level.toString().padStart(3, "0")}:\n${content}`;
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
  await editor.edit(async (editBuilder) => {
    if (!sandboxDocument) return;
    const entireRange = new vscode.Range(
      sandboxDocument.positionAt(0),
      sandboxDocument.positionAt(sandboxDocument.getText().length)
    );
    editBuilder.replace(entireRange, content);
    await editor.revealRange(
      new vscode.Range(0, 0, 0, 0),
      vscode.TextEditorRevealType.AtTop
    );
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
  return editor;
}
function gameLoop(game: number, editor: vscode.TextEditor) {
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
        editor = await changeSandboxContent(getGameLevel(game));
      } else if (charUnderCursor == "e") {
        currentLevel += 1;
        if (currentLevel == games[game].length) {
          currentLevel = 0;
        }
        editor = await changeSandboxContent(getGameLevel(game));
      }
    }
  );
}
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vim-exercises.game0-hjkl", async () => {
      currentLevel = 0;
      let editor = await changeSandboxContent(getGameLevel(0));
      gameLoop(0, editor);
    })
  );
  async function getVisableLinesCount() {
    let content = "";
    for (let i = 0; i < 101; i++) {
      content += "\n";
    }
    const editor = await changeSandboxContent(content);
    const visibleRanges = editor.visibleRanges;
    let visibleLines = 0;
    for (const range of visibleRanges) {
      visibleLines += range.end.line - range.start.line + 1;
    }
    return visibleLines;
  }
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vim-exercises.game1-relative-line-jump",
      async () => {
        currentLevel = 0;
        const visibleLines = await getVisableLinesCount();
        games[1] = generateGame1Levels(999, visibleLines);
        let editor = await changeSandboxContent(getGameLevel(1));
        gameLoop(1, editor);
      }
    )
  );
}

export function deactivate() {}
