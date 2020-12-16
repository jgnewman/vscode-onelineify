import * as vscode from 'vscode'

function oneLineify(textEditor: vscode.TextEditor, startLine: number, endLine: number) {
  const { maxLineLength, padCurlyBraces, padSquareBrackets, padParens } = vscode.workspace.getConfiguration('onelineify')
  const initialSpacing = textEditor.document.lineAt(startLine).text.replace(/[^\s].*$/, '')

  let lines: string[] = []

  for (let i = startLine; i <= endLine; i++) {
    let text = textEditor.document.lineAt(i).text.trim()
    if (text.length) {
      lines.push(text)
    }
  }

  let joined: string
  joined = lines.join(' ')
  joined = joined.replace(/,([^\s])/g, ', $1') // ensure spaces after commas
  joined = joined.replace(/\s+,/g, ',') // remove spaces before commas
  joined = joined.replace(/,{2,}/g, ',') // remove extra commas appearing together
  joined = joined.replace(/(\{|\(|\[)\s*,\s*/g, '$1') // ensure the first item is not a comma
  joined = joined.replace(/\s*,\s*(\}|\)|\])/g, '$1') // ensure the last item is not a comma
  joined = joined.replace(/\:\s+/g, ': ') // ensure only once space falls after colons

  if (padCurlyBraces) {
    joined = joined.replace(/\{([^\s])/g, '{ $1') // ensure a space after opening `{`
    joined = joined.replace(/([^\s]+)\}/g, '$1 }') // ensure a space before closing `}`
  } else {
    joined = joined.replace(/\{\s+/g, '{') // ensure no space after opening `{`
    joined = joined.replace(/\s+\}/g, '}') // ensure no space before closing `{`
  }

  if (padSquareBrackets) {
    joined = joined.replace(/\[([^\s])/g, '[ $1') // ensure a space after opening `[`
    joined = joined.replace(/([^\s]+)\]/g, '$1 ]') // ensure a space before closing `]`
  } else {
    joined = joined.replace(/\[\s+/g, '[') // ensure no space after opening `[`
    joined = joined.replace(/\s+\]/g, ']') // ensure no space before closing `]`
  }

  if (padParens) {
    joined = joined.replace(/\(([^\s])/g, '( $1') // ensure a space after opening `(`
    joined = joined.replace(/([^\s]+)\)/g, '$1 )') // ensure a space before closing `)`
  } else {
    joined = joined.replace(/\(\s+/g, '(') // ensure no space after opening `(`
    joined = joined.replace(/\s+\)/g, ')') // ensure no space before closing `)`
  }

  joined = initialSpacing + joined

  if (joined.length > maxLineLength) {
    vscode.window.showInformationMessage(`
      Selection was not changed because onelineified text would have been longer
      than the max allowed line length. You can tweak this value in Extension Settings.
    `.trim().replace(/\s+/, ' '))
    return
  }

  return textEditor.edit(editBuilder => {
    const range = new vscode.Range(startLine, 0, endLine, textEditor.document.lineAt(endLine).text.length)
    editBuilder.replace(range, joined)
  })
}

export function activate(context: vscode.ExtensionContext) {
  const main = vscode.commands.registerCommand('onelineify.main', () => {
    const textEditor = vscode.window.activeTextEditor

    if (!textEditor) {
      return
    }

    const selection = textEditor.selection

    if (selection.isEmpty) {
      return selection
    }

    const hasTrailingNewLine = textEditor.selection.end.character === 0
    const endLine = hasTrailingNewLine ? selection.end.line - 1 : selection.end.line

    return oneLineify(textEditor, selection.start.line, endLine)
  })

  context.subscriptions.push(main)
}

export function deactivate() {}
