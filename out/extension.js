"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeUpdateHandler = void 0;
const vscode = __importStar(require("vscode"));
const xmldom_1 = require("xmldom");
class CodeUpdateHandler {
    constructor(editor) {
        this.editor = editor;
    }
    parseUpdates(xmlString) {
        const parser = new xmldom_1.DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const updateNodes = xmlDoc.getElementsByTagName('code-update');
        const updates = [];
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
    generateEdits(updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = [];
            const document = this.editor.document;
            for (const update of updates) {
                const range = yield this.findContextRange(update.context, update.subcontext);
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
        });
    }
    findContextRange(context, subcontext) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                contextEnd = contextStart;
            }
            if (contextEnd === -1) {
                contextEnd = contextStart;
            }
            return new vscode.Range(new vscode.Position(contextStart, 0), new vscode.Position(contextEnd, lines[contextEnd].length));
        });
    }
}
exports.CodeUpdateHandler = CodeUpdateHandler;
//# sourceMappingURL=extension.js.map