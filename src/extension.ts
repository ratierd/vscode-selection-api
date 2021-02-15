// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "selection-api.selectMatching",
      selectMatching
    )
  );
}

function findOccurances(
  doc: vscode.TextDocument,
  line: number,
  char: string
): Array<number> {
  var content = doc.lineAt(line);
  var matches = (content.text + "hack")
    .split(char)
    .reduce((acc: Array<number>, p) => {
      var len = p.length + 1;
      if (acc.length > 0) {
        len += acc[acc.length - 1];
      }
      acc.push(len);
      return acc;
    }, []);
  matches.pop();
  return matches;
}

function findNext(
  doc: vscode.TextDocument,
  line: number,
  char: string,
  start_index: number = 0,
  nest_char: any = undefined,
  nested: number = 0
): vscode.Position | null {
  if (line === doc.lineCount) {
    return null;
  }
  var occurances = findOccurances(doc, line, char).filter(
    (n) => n >= start_index
  );
  var nests = nest_char
    ? findOccurances(doc, line, nest_char).filter((n) => n >= start_index)
    : [];
  var occurance_index = 0;
  var nests_index = 0;
  while (
    (occurance_index < occurances.length || nests_index < nests.length) &&
    nested >= 0
  ) {
    if (
      occurances[occurance_index] < nests[nests_index] ||
      !nests[nests_index]
    ) {
      if (nested === 0) {
        return new vscode.Position(line, occurances[occurance_index]);
      }
      nested--;
      occurance_index++;
    } else if (
      nests[nests_index] < occurances[occurance_index] ||
      !occurances[occurance_index]
    ) {
      nested++;
      nests_index++;
    }
  }
  return findNext(doc, ++line, char, 0, nest_char, nested);
}
function findPrevious(
  doc: vscode.TextDocument,
  line: number,
  char: string,
  start_index: number = doc.lineAt(line).text.length,
  nest_char: any = undefined,
  nested: number = 0
): vscode.Position | null {
  if (line === -1) {
    return null;
  }
  var occurances = findOccurances(doc, line, char).filter(
    (n) => n <= start_index
  );
  var nests = nest_char
    ? findOccurances(doc, line, nest_char).filter((n) => n <= start_index)
    : [];
  var occurance_index = occurances.length - 1;
  var nests_index = nests.length - 1;
  while ((occurance_index > -1 || nests_index > -1) && nested >= 0) {
    if (
      occurances[occurance_index] > nests[nests_index] ||
      !nests[nests_index]
    ) {
      if (nested === 0) {
        return new vscode.Position(line, occurances[occurance_index]);
      }
      nested--;
      occurance_index--;
    } else if (
      nests[nests_index] > occurances[occurance_index] ||
      !occurances[occurance_index]
    ) {
      nested++;
      nests_index--;
    }
  }
  return findPrevious(doc, --line, char, undefined, nest_char, nested);
}

interface MatchingSelectOptions {
  start_char: string;
  end_char: string;
  outer?: boolean;
}
function selectMatching({
  start_char = "",
  end_char = start_char,
  outer = false,
}: MatchingSelectOptions) {
  let editor = vscode.window.activeTextEditor;
  if (!editor || !start_char) {
    return;
  }
  let doc = editor.document;
  let sel = editor.selections;
  let start_offset = outer ? start_char.length : 0;
  let end_offset = outer ? end_char.length : 0;
  editor.selections = sel.map((s) => {
    let { line, character } = s.active;
    let start_pos: vscode.Position | null =
      findPrevious(doc, line, start_char, character, end_char) ||
      new vscode.Position(line, character);
    if (!start_pos) {
      return s;
    }
    let end_pos: vscode.Position | null = findNext(
      doc,
      start_pos.line,
      end_char,
      start_pos.character + 1,
      start_char
    );
    if (!end_pos) {
      return s;
    }

    //Automatically grow to outer selection
    if (
      !outer &&
      start_pos.isEqual(s.anchor) &&
      new vscode.Position(end_pos.line, end_pos.character - 1).isEqual(s.end)
    ) {
      start_offset = start_char.length;
      end_offset = end_char.length;
    }
    start_pos = new vscode.Position(
      start_pos.line,
      start_pos.character - start_offset
    );
    end_pos = new vscode.Position(
      end_pos.line,
      end_pos.character - 1 + end_offset
    );
    return new vscode.Selection(start_pos, end_pos);
  });
}
