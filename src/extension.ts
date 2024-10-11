import * as vscode from 'vscode';
import { CodeUpdateHandler } from './codeUpdateHandler';

export function activate(context: vscode.ExtensionContext) {
    let outputChannel: vscode.OutputChannel | undefined;
    const config = vscode.workspace.getConfiguration('claudeCodeClipboard');
    if (config.get('enableLogging')) {
        outputChannel = vscode.window.createOutputChannel('Claude Code Clipboard');
    }

    function log(message: string) {
        if (outputChannel) {
            outputChannel.appendLine(message);
        }
        console.log(message);
    }
    log('Claude Code Clipboard extension is now active');

    let disposable = vscode.commands.registerCommand('claudeCodeClipboard.applyUpdates', async () => {
        log('Claude Code Clipboard: applyUpdates command triggered');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            log('Claude Code Clipboard: No active editor found');
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const clipboard = await vscode.env.clipboard.readText();
        if (!clipboard) {
            log('Claude Code Clipboard: Clipboard is empty');
            vscode.window.showErrorMessage('Clipboard is empty');
            return;
        }

        log('Claude Code Clipboard: Clipboard content:');
        log(clipboard);

        try {
            const handler = new CodeUpdateHandler(editor);
            const updates = handler.parseUpdates(clipboard);
            
            log(`Claude Code Clipboard: Parsed ${updates.length} updates`);

            if (updates.length === 0) {
                log('Claude Code Clipboard: No updates found in clipboard content');
                vscode.window.showInformationMessage('No updates found in clipboard content');
                return;
            }

            const edits = await handler.generateEdits(updates);

            log(`Claude Code Clipboard: Generated ${edits.length} edits`);

            if (edits.length === 0) {
                log('Claude Code Clipboard: No applicable updates found for the current file');
                vscode.window.showInformationMessage('No applicable updates found for the current file');
                return;
            }

            const edit = new vscode.WorkspaceEdit();
            edit.set(editor.document.uri, edits);

            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                log('Claude Code Clipboard: Code updates applied successfully');
                vscode.window.showInformationMessage(`Applied ${edits.length} code updates successfully`);
            } else {
                log('Claude Code Clipboard: Failed to apply code updates');
                vscode.window.showErrorMessage('Failed to apply code updates');
            }
        } catch (error) {
            log(`Claude Code Clipboard: Error applying updates: ${error}`);
            vscode.window.showErrorMessage(`Error applying updates: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}