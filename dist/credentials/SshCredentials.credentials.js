"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SshCredentials = void 0;
class SshCredentials {
    constructor() {
        this.name = 'sshCredentials';
        this.displayName = 'SSH Credentials';
        this.documentationUrl = 'https://docs.n8n.io/integrations/creating-nodes/build/credentials/';
        this.properties = [
            {
                displayName: 'Authentication Type',
                name: 'authenticationType',
                type: 'options',
                options: [
                    {
                        name: 'Username & Password',
                        value: 'password',
                    },
                    {
                        name: 'SSH Key',
                        value: 'sshKey',
                    },
                ],
                default: 'password',
            },
            {
                displayName: 'Host',
                name: 'host',
                type: 'string',
                default: '',
                placeholder: 'example.com',
                description: 'The hostname or IP address of the SSH server',
                required: true,
            },
            {
                displayName: 'Port',
                name: 'port',
                type: 'number',
                default: 22,
                description: 'The port number of the SSH server',
                required: true,
            },
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
                description: 'The username to use for authentication',
                required: true,
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'The password to use for authentication',
                displayOptions: {
                    show: {
                        authenticationType: ['password'],
                    },
                },
                required: true,
            },
            {
                displayName: 'Private Key',
                name: 'privateKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'The private key to use for authentication',
                displayOptions: {
                    show: {
                        authenticationType: ['sshKey'],
                    },
                },
                required: true,
            },
            {
                displayName: 'Passphrase',
                name: 'passphrase',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'The passphrase for the private key (if required)',
                displayOptions: {
                    show: {
                        authenticationType: ['sshKey'],
                    },
                },
            },
        ];
    }
}
exports.SshCredentials = SshCredentials;
//# sourceMappingURL=SshCredentials.credentials.js.map