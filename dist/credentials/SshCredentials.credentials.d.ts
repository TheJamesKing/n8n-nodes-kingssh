import { ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class SshCredentials implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    properties: INodeProperties[];
}
