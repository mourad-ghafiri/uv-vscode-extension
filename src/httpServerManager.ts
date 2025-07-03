import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export class HTTPServerManager {
    private serverProcess: cp.ChildProcess | null = null;
    private running: boolean = false;
    private currentPort: number = 8000;
    private currentFolder: string = '';
    private statusChangedEmitter = new vscode.EventEmitter<void>();
    public readonly onStatusChanged = this.statusChangedEmitter.event;

    public isRunning(): boolean {
        return this.running;
    }

    public getPort(): number {
        return this.currentPort;
    }

    public getFolder(): string {
        return this.currentFolder;
    }

    public async startServer(folder: string, port: number): Promise<boolean> {
        if (this.running) {
            vscode.window.showWarningMessage('HTTP server is already running.');
            return false;
        }
        this.currentFolder = folder;
        this.currentPort = port;
        const outputChannel = vscode.window.createOutputChannel('UV HTTP Server');
        outputChannel.appendLine(`[HTTP Server] Starting in ${folder} on port ${port}`);
        // Determine python executable
        let pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        try {
            this.serverProcess = cp.spawn(pythonCmd, ['-m', 'http.server', String(port)], {
                cwd: folder,
            });
            this.serverProcess.stdout?.on('data', (data) => {
                outputChannel.appendLine(`[stdout] ${data.toString()}`);
            });
            this.serverProcess.stderr?.on('data', (data) => {
                outputChannel.appendLine(`[stderr] ${data.toString()}`);
                if (data.toString().includes('Address already in use')) {
                    vscode.window.showErrorMessage(`Port ${port} is already in use. Please choose another port.`);
                    this.stopServer();
                } else if (data.toString().toLowerCase().includes('error')) {
                    vscode.window.showErrorMessage(`HTTP server error: ${data.toString()}`);
                }
            });
            this.serverProcess.on('error', (err: any) => {
                outputChannel.appendLine(`[error] ${err.toString()}`);
                if (err.code === 'ENOENT' && pythonCmd === 'python3') {
                    vscode.window.showErrorMessage(`'python3' was not found in your PATH. Please install Python 3 or add it to your PATH.`);
                } else if (err.code === 'ENOENT' && pythonCmd === 'python') {
                    // Try python3 as fallback
                    outputChannel.appendLine(`[HTTP Server] 'python' not found, trying 'python3'...`);
                    this.tryPython3Fallback(folder, port, outputChannel);
                    return;
                } else {
                    vscode.window.showErrorMessage(`Failed to start HTTP server: ${err}`);
                }
                this.running = false;
                this.statusChangedEmitter.fire();
            });
            this.serverProcess.on('exit', (code, signal) => {
                this.running = false;
                this.statusChangedEmitter.fire();
                outputChannel.appendLine(`[HTTP Server] Stopped (code: ${code}, signal: ${signal})`);
                vscode.window.showInformationMessage('HTTP server stopped.');
            });
            this.running = true;
            this.statusChangedEmitter.fire();
            vscode.window.showInformationMessage(`HTTP server started on http://localhost:${port}/`);
            outputChannel.show(true);
            return true;
        } catch (error: any) {
            if (error.code === 'ENOENT' && pythonCmd === 'python') {
                // Try python3 as fallback
                outputChannel.appendLine(`[HTTP Server] 'python' not found, trying 'python3'...`);
                return await this.tryPython3Fallback(folder, port, outputChannel);
            }
            vscode.window.showErrorMessage(`Failed to start HTTP server: ${error}`);
            this.running = false;
            this.statusChangedEmitter.fire();
            return false;
        }
    }

    private async tryPython3Fallback(folder: string, port: number, outputChannel: vscode.OutputChannel): Promise<boolean> {
        try {
            this.serverProcess = cp.spawn('python3', ['-m', 'http.server', String(port)], {
                cwd: folder,
            });
            this.serverProcess.stdout?.on('data', (data) => {
                outputChannel.appendLine(`[stdout] ${data.toString()}`);
            });
            this.serverProcess.stderr?.on('data', (data) => {
                outputChannel.appendLine(`[stderr] ${data.toString()}`);
                if (data.toString().includes('Address already in use')) {
                    vscode.window.showErrorMessage(`Port ${port} is already in use. Please choose another port.`);
                    this.stopServer();
                } else if (data.toString().toLowerCase().includes('error')) {
                    vscode.window.showErrorMessage(`HTTP server error: ${data.toString()}`);
                }
            });
            this.serverProcess.on('error', (err: any) => {
                outputChannel.appendLine(`[error] ${err.toString()}`);
                if (err.code === 'ENOENT') {
                    vscode.window.showErrorMessage(`Neither 'python' nor 'python3' was found in your PATH. Please install Python 3 or add it to your PATH.`);
                } else {
                    vscode.window.showErrorMessage(`Failed to start HTTP server: ${err}`);
                }
                this.running = false;
                this.statusChangedEmitter.fire();
            });
            this.serverProcess.on('exit', (code, signal) => {
                this.running = false;
                this.statusChangedEmitter.fire();
                outputChannel.appendLine(`[HTTP Server] Stopped (code: ${code}, signal: ${signal})`);
                vscode.window.showInformationMessage('HTTP server stopped.');
            });
            this.running = true;
            this.statusChangedEmitter.fire();
            vscode.window.showInformationMessage(`HTTP server started on http://localhost:${port}/`);
            outputChannel.show(true);
            return true;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                vscode.window.showErrorMessage(`Neither 'python' nor 'python3' was found in your PATH. Please install Python 3 or add it to your PATH.`);
            } else {
                vscode.window.showErrorMessage(`Failed to start HTTP server: ${error}`);
            }
            this.running = false;
            this.statusChangedEmitter.fire();
            return false;
        }
    }

    public stopServer(): void {
        if (this.serverProcess && this.running) {
            try {
                process.kill(-this.serverProcess.pid!);
            } catch {
                // fallback: try to kill normally
                try { this.serverProcess.kill(); } catch { }
            }
            this.serverProcess = null;
            this.running = false;
            this.statusChangedEmitter.fire();
            vscode.window.showInformationMessage('HTTP server stopped.');
        } else {
            vscode.window.showWarningMessage('No HTTP server is running.');
        }
    }
} 