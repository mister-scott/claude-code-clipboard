import * as vscode from 'vscode';
import { CodeUpdateHandler } from './codeUpdateHandler';

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Code Clipboard extension is now active');

    let disposable = vscode.commands.registerCommand('claudeCodeClipboard.applyUpdates', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const clipboard = await vscode.env.clipboard.readText();
        if (!clipboard) {
            vscode.window.showErrorMessage('Clipboard is empty');
            return;
        }

        try {
            const handler = new CodeUpdateHandler(editor);
            const updates = handler.parseUpdates(clipboard);
            const edits = await handler.generateEdits(updates);

            if (edits.length === 0) {
                vscode.window.showInformationMessage('No updates to apply');
                return;
            }

            const edit = new vscode.WorkspaceEdit();
            edit.set(editor.document.uri, edits);

            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                vscode.window.showInformationMessage('Code updates applied successfully');
            } else {
                vscode.window.showErrorMessage('Failed to apply code updates');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error applying updates: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}