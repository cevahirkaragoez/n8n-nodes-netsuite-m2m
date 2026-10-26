import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NetSuiteM2M implements ICredentialType {
	name = 'netsuiteM2M';
	displayName = 'NetSuite (TBA / M2M)';
	documentationUrl = 'netsuite';
	properties: INodeProperties[] = [
        { displayName: 'Authentication', name: 'authType', type: 'options', options: [
            { name: 'OAuth 1.0 TBA', value: 'oauth1' },
            { name: 'OAuth 2.0 M2M', value: 'oauth2M2M' },
        ], default: 'oauth2M2M' },
		{
			displayName: 'Hostname',
			name: 'hostname',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Account ID',
			name: 'accountId',
			type: 'string',
			default: '',
			required: true,
			description: 'NetSuite Account ID',
		},
		{
			displayName: 'Consumer Key',
			name: 'consumerKey',
            displayOptions: { show: { authType: ['oauth1'] } },
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Consumer Secret',
			name: 'consumerSecret',
            displayOptions: { show: { authType: ['oauth1'] } },
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
		{
			displayName: 'Token Key',
			name: 'tokenKey',
            displayOptions: { show: { authType: ['oauth1'] } },
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Token Secret',
			name: 'tokenSecret',
            displayOptions: { show: { authType: ['oauth1'] } },
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
        { displayName: 'Client ID', name: 'clientId', type: 'string', default: '', required: true, displayOptions: { show: { authType: ['oauth2M2M'] } } },
        { displayName: 'Certificate ID', name: 'certificateId', type: 'string', default: '', required: true, displayOptions: { show: { authType: ['oauth2M2M'] } } },
        { displayName: 'Private Key (PEM)', name: 'privateKey', type: 'string', typeOptions: { password: true, rows: 8 }, default: '', required: true, displayOptions: { show: { authType: ['oauth2M2M'] } } },
        { displayName: 'Scope', name: 'scope', type: 'string', default: 'rest_webservices', required: true, displayOptions: { show: { authType: ['oauth2M2M'] } } },
    ];
}
