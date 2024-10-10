// src/codeUpdateHandler.ts
import * as vscode from 'vscode';
import { DOMParser } from 'xmldom';

interface CodeUpdate {
    action: string;
    context: string;
    subcontext?: string;
    content: string;
}

export class CodeUpdateHandler {
    private editor: vscode.TextEditor;

    constructor(editor: vscode.TextEditor) {
        this.editor = editor;
    }

    parseUpdates(xmlString: string): CodeUpdate[] {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const updateNodes = xmlDoc.getElementsByTagName('code-update');
        const updates: CodeUpdate[] = [];

        for (let i = 0; i < updateNodes.length; i++) {
            const node = updateNodes[i];
            updates.push({
                action: node.getAttribute('action') || '',
                context: node.getAttribute('context') || '',
                subcontext: node.getAttribute('subcontext') || undefined,
                content: node.textContent || ''
            });
        }

        return updates;
    }

    async generateEdits(updates: CodeUpdate[]): Promise<vscode.TextEdit[]> {
        const edits: vscode.TextEdit[] = [];
        const document = this.editor.document;

        for (const update of updates) {
            const range = await this.findContextRange(update.context, update.subcontext);
            if (range) {
                switch (update.action) {
                    case 'replace':
                        edits.push(vscode.TextEdit.replace(range, update.content));
                        break;
                    case 'insert':
                        edits.push(vscode.TextEdit.insert(range.end, '\n' + update.content));
                        break;
                    case 'delete':
                        edits.push(vscode.TextEdit.delete(range));
                        break;
                }
            }
        }

        return edits;
    }

    private async findContextRange(context: string, subcontext?: string): Promise<vscode.Range | null> {
        const document = this.editor.document;
        const fullText = document.getText();
        const lines = fullText.split('\n');

        let contextStart = -1;
        let contextEnd = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(context)) {
                contextStart = i;
                break;
            }
        }

        if (contextStart === -1) {
            return null;
        }

        if (subcontext) {
            for (let i = contextStart + 1; i < lines.length; i++) {
                if (lines[i].includes(subcontext)) {
                    contextEnd = i;
                    break;
                }
            }
        } else {
            contextEnd = contextStart;
        }

        if (contextEnd === -1) {
            contextEnd = contextStart;
        }

        return new vscode.Range(
            new vscode.Position(contextStart, 0),
            new vscode.Position(contextEnd, lines[contextEnd].length)
        );
    }
}