"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ssh = void 0;
const ssh2_1 = require("ssh2");
const n8n_workflow_1 = require("n8n-workflow");
class Ssh {
    constructor() {
        this.description = {
            displayName: 'SSH',
            name: 'ssh',
            icon: 'fa:terminal',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Execute commands via SSH',
            defaults: {
                name: 'SSH',
            },
            inputs: ["main"],
            outputs: ["main"],
            credentials: [
                {
                    name: 'sshCredentials',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Command',
                            value: 'command',
                        },
                        {
                            name: 'File',
                            value: 'file',
                        },
                    ],
                    default: 'command',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    displayOptions: {
                        show: {
                            resource: ['command'],
                        },
                    },
                    options: [
                        {
                            name: 'Execute',
                            value: 'execute',
                            description: 'Execute a command',
                            action: 'Execute a command',
                        },
                    ],
                    default: 'execute',
                },
                {
                    displayName: 'Command',
                    name: 'command',
                    type: 'string',
                    displayOptions: {
                        show: {
                            resource: ['command'],
                            operation: ['execute'],
                        },
                    },
                    default: '',
                    placeholder: 'ls -la',
                    description: 'The command to execute on the remote system',
                    required: true,
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    displayOptions: {
                        show: {
                            resource: ['file'],
                        },
                    },
                    options: [
                        {
                            name: 'Download',
                            value: 'download',
                            description: 'Download a file',
                            action: 'Download a file',
                        },
                        {
                            name: 'Upload',
                            value: 'upload',
                            description: 'Upload a file',
                            action: 'Upload a file',
                        },
                    ],
                    default: 'download',
                },
                {
                    displayName: 'Remote File Path',
                    name: 'remotePath',
                    type: 'string',
                    displayOptions: {
                        show: {
                            resource: ['file'],
                        },
                    },
                    default: '',
                    placeholder: '/path/to/remote/file',
                    description: 'The path of the remote file',
                    required: true,
                },
                {
                    displayName: 'Local File Path',
                    name: 'localPath',
                    type: 'string',
                    displayOptions: {
                        show: {
                            resource: ['file'],
                        },
                    },
                    default: '',
                    placeholder: '/path/to/local/file',
                    description: 'The path of the local file',
                    required: true,
                },
                {
                    displayName: 'Binary Property',
                    name: 'binaryPropertyName',
                    type: 'string',
                    default: 'data',
                    displayOptions: {
                        show: {
                            resource: ['file'],
                            operation: ['download'],
                        },
                    },
                    description: 'Name of the binary property to which to write the data of the read file',
                    required: true,
                },
                {
                    displayName: 'Binary Property',
                    name: 'binaryPropertyName',
                    type: 'string',
                    default: 'data',
                    displayOptions: {
                        show: {
                            resource: ['file'],
                            operation: ['upload'],
                        },
                    },
                    description: 'Name of the binary property which contains the data for the file to be uploaded',
                    required: true,
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                const credentials = await this.getCredentials('sshCredentials');
                const client = new ssh2_1.Client();
                await new Promise((resolve, reject) => {
                    client.on('ready', () => {
                        resolve();
                    }).on('error', (err) => {
                        reject(new Error(`SSH connection error: ${err.message}`));
                    }).connect({
                        host: credentials.host,
                        port: credentials.port,
                        username: credentials.username,
                        password: credentials.authenticationType === 'password' ? credentials.password : undefined,
                        privateKey: credentials.authenticationType === 'sshKey' ? credentials.privateKey : undefined,
                        passphrase: credentials.authenticationType === 'sshKey' && credentials.passphrase ? credentials.passphrase : undefined,
                    });
                });
                let result;
                if (resource === 'command') {
                    if (operation === 'execute') {
                        const command = this.getNodeParameter('command', i);
                        const commandResult = await new Promise((resolve, reject) => {
                            client.exec(command, (err, channel) => {
                                if (err) {
                                    return reject(new Error(`Failed to execute command: ${err.message}`));
                                }
                                let stdout = '';
                                let stderr = '';
                                channel.on('data', (data) => {
                                    stdout += data.toString();
                                });
                                channel.stderr.on('data', (data) => {
                                    stderr += data.toString();
                                });
                                channel.on('close', () => {
                                    resolve({ stdout, stderr });
                                });
                                channel.on('error', (err) => {
                                    reject(new Error(`Command execution error: ${err.message}`));
                                });
                            });
                        });
                        result = {
                            json: {
                                command,
                                stdout: commandResult.stdout,
                                stderr: commandResult.stderr,
                            },
                        };
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "${resource}"!`);
                    }
                }
                else if (resource === 'file') {
                    const remotePath = this.getNodeParameter('remotePath', i);
                    const localPath = this.getNodeParameter('localPath', i);
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
                    if (operation === 'download') {
                        const fileContent = await new Promise((resolve, reject) => {
                            client.sftp((err, sftp) => {
                                if (err) {
                                    return reject(new Error(`Failed to initialize SFTP: ${err.message}`));
                                }
                                sftp.readFile(remotePath, (err, data) => {
                                    if (err) {
                                        return reject(new Error(`Failed to read file: ${err.message}`));
                                    }
                                    resolve(data);
                                });
                            });
                        });
                        const fileName = remotePath.split('/').pop() || 'file';
                        const binaryData = await this.helpers.prepareBinaryData(fileContent, fileName);
                        result = {
                            json: {
                                fileName,
                                remotePath,
                                localPath,
                                success: true,
                            },
                            binary: {
                                [binaryPropertyName]: binaryData,
                            },
                        };
                    }
                    else if (operation === 'upload') {
                        const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
                        const fileContent = Buffer.from(binaryData.data, 'base64');
                        await new Promise((resolve, reject) => {
                            client.sftp((err, sftp) => {
                                if (err) {
                                    return reject(new Error(`Failed to initialize SFTP: ${err.message}`));
                                }
                                sftp.writeFile(remotePath, fileContent, (err) => {
                                    if (err) {
                                        return reject(new Error(`Failed to write file: ${err.message}`));
                                    }
                                    resolve();
                                });
                            });
                        });
                        result = {
                            json: {
                                fileName: binaryData.fileName,
                                remotePath,
                                localPath,
                                success: true,
                            },
                        };
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "${resource}"!`);
                    }
                }
                else {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `The resource "${resource}" is not supported!`);
                }
                client.end();
                returnData.push(result);
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.Ssh = Ssh;
//# sourceMappingURL=Ssh.node.js.map