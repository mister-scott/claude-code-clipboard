import * as vscode from 'vscode';
import { DOMParser } from '@xmldom/xmldom';

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
        console.log('CodeUpdateHandler: Parsing updates from XML');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const updateNodes = xmlDoc.getElementsByTagName('code-update');
        const updates: CodeUpdate[] = [];

        for (let i = 0; i < updateNodes.length; i++) {
            const node = updateNodes[i];
            const update = {
                action: node.getAttribute('action') || '',
                context: node.getAttribute('context') || '',
                subcontext: node.getAttribute('subcontext') || undefined,
                content: node.textContent || ''
            };
            updates.push(update);
            console.log(`CodeUpdateHandler: Parsed update ${i + 1}:`, JSON.stringify(update));
        }

        console.log(`CodeUpdateHandler: Parsed ${updates.length} updates`);
        return updates;
    }

    async generateEdits(updates: CodeUpdate[]): Promise<vscode.TextEdit[]> {
        console.log('CodeUpdateHandler: Generating edits');
        const edits: vscode.TextEdit[] = [];
        const document = this.editor.document;

        for (let i = 0; i < updates.length; i++) {
            const update = updates[i];
            console.log(`CodeUpdateHandler: Processing update ${i + 1}:`, JSON.stringify(update));
            const range = await this.findContextRange(update.context, update.subcontext);
            if (range) {
                console.log(`CodeUpdateHandler: Found range for context:`, range.toString());
                let edit: vscode.TextEdit;
                switch (update.action) {
                    case 'replace':
                        edit = vscode.TextEdit.replace(range, update.content);
                        break;
                    case 'insert':
                        edit = vscode.TextEdit.insert(range.end, '\n' + update.content);
                        break;
                    case 'delete':
                        edit = vscode.TextEdit.delete(range);
                        break;
                    default:
                        console.log(`CodeUpdateHandler: Unknown action ${update.action}`);
                        continue;
                }
                edits.push(edit);
                console.log(`CodeUpdateHandler: Added ${update.action} edit`);
            } else {
                console.log(`CodeUpdateHandler: Could not find context for update: ${update.context}`);
            }
        }

        console.log(`CodeUpdateHandler: Generated ${edits.length} edits`);
        return edits;
    }

    private async findContextRange(context: string, subcontext?: string): Promise<vscode.Range | null> {
        console.log(`CodeUpdateHandler: Finding context range for context: "${context}", subcontext: "${subcontext}"`);
        const document = this.editor.document;
        const fullText = document.getText();
        const lines = fullText.split('\n');

        let contextStart = -1;
        let contextEnd = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(context)) {
                contextStart = i;
                console.log(`CodeUpdateHandler: Found context start at line ${i}`);
                break;
            }
        }

        if (contextStart === -1) {
            console.log(`CodeUpdateHandler: Context not found: ${context}`);
            return null;
        }

        if (subcontext) {
            for (let i = contextStart + 1; i < lines.length; i++) {
                if (lines[i].includes(subcontext)) {
                    contextEnd = i;
                    console.log(`CodeUpdateHandler: Found subcontext end at line ${i}`);
                    break;
                }
            }
        } else {
            contextEnd = contextStart;
        }

        if (contextEnd === -1) {
            contextEnd = contextStart;
        }

        const range = new vscode.Range(
            new vscode.Position(contextStart, 0),
            new vscode.Position(contextEnd, lines[contextEnd].length)
        );
        console.log(`CodeUpdateHandler: Returning range: ${range.toString()}`);
        return range;
    }
}