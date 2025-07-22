import { Client } from 'ssh2';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class Ssh implements INodeType {
	description: INodeTypeDescription = {
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
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
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
			// Command operations
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
			// File operations
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// For each item, execute the operation
		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// Get credentials
				const credentials = await this.getCredentials('sshCredentials');
				
				// Create SSH client
				const client = new Client();
				
				// Connect to the SSH server
				await new Promise<void>((resolve, reject) => {
					client.on('ready', () => {
						resolve();
					}).on('error', (err) => {
						reject(new Error(`SSH connection error: ${err.message}`));
					}).connect({
						host: credentials.host as string,
						port: credentials.port as number,
						username: credentials.username as string,
						password: credentials.authenticationType === 'password' ? credentials.password as string : undefined,
						privateKey: credentials.authenticationType === 'sshKey' ? credentials.privateKey as string : undefined,
						passphrase: credentials.authenticationType === 'sshKey' && credentials.passphrase ? credentials.passphrase as string : undefined,
					});
				});

				let result: INodeExecutionData;

				if (resource === 'command') {
					if (operation === 'execute') {
						// Execute command
						const command = this.getNodeParameter('command', i) as string;
						
						const commandResult = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
							client.exec(command, (err, channel) => {
								if (err) {
									return reject(new Error(`Failed to execute command: ${err.message}`));
								}
								
								let stdout = '';
								let stderr = '';
								
								channel.on('data', (data: Buffer) => {
									stdout += data.toString();
								});
								
								channel.stderr.on('data', (data: Buffer) => {
									stderr += data.toString();
								});
								
								channel.on('close', () => {
									resolve({ stdout, stderr });
								});
								
								channel.on('error', (err: Error) => {
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
					} else {
						throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "${resource}"!`);
					}
				} else if (resource === 'file') {
					const remotePath = this.getNodeParameter('remotePath', i) as string;
					const localPath = this.getNodeParameter('localPath', i) as string;
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					
					if (operation === 'download') {
						// Download file
						const fileContent = await new Promise<Buffer>((resolve, reject) => {
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
						
						// Get file name from path
						const fileName = remotePath.split('/').pop() || 'file';
						
						// Create binary data
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
					} else if (operation === 'upload') {
						// Get binary data
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const fileContent = Buffer.from(binaryData.data, 'base64');
						
						// Upload file
						await new Promise<void>((resolve, reject) => {
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
					} else {
						throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "${resource}"!`);
					}
				} else {
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported!`);
				}
				
				// Close the connection
				client.end();
				
				returnData.push(result);
			} catch (error) {
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