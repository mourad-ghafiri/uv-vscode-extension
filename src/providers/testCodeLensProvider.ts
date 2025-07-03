import * as vscode from 'vscode';

export class TestCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];

        // Only provide CodeLenses for test files
        if (!this.isTestFile(document.fileName)) {
            return codeLenses;
        }

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            // Look for test function definitions
            const testFunctionMatch = text.match(/^def\s+(test_\w+)\s*\(/);
            if (testFunctionMatch) {
                const testMethodName = testFunctionMatch[1];
                const range = new vscode.Range(i, 0, i, line.text.length);

                const runTestCommand: vscode.Command = {
                    title: `$(play) Run Test: ${testMethodName}`,
                    command: 'uv.runTestMethod',
                    arguments: []
                };

                codeLenses.push(new vscode.CodeLens(range, runTestCommand));
            }
        }

        return codeLenses;
    }

    resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.CodeLens | Promise<vscode.CodeLens> {
        return codeLens;
    }

    private isTestFile(fileName: string): boolean {
        const testPatterns = [
            /test_.*\.py$/,
            /.*_test\.py$/,
            /.*test.*\.py$/
        ];
        return testPatterns.some(pattern => pattern.test(fileName));
    }

    dispose(): void {
        this._onDidChangeCodeLenses.dispose();
    }
} 