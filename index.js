const { Ssh } = require('./dist/nodes/Ssh/Ssh.node');
const { SshCredentials } = require('./dist/credentials/SshCredentials.credentials');

module.exports = {
	nodes: [
		Ssh,
	],
	credentials: [
		SshCredentials,
	],
};
