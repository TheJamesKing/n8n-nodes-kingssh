# n8n-nodes-kingssh

This is an n8n community node package that provides SSH functionality for n8n workflows. It allows you to execute commands and transfer files via SSH using either username/password or SSH key authentication.

## Features

- **Authentication Methods**:
  - Username and Password
  - SSH Key (with optional passphrase)

- **Operations**:
  - Execute SSH commands
  - Download files via SFTP
  - Upload files via SFTP

## Installation

Follow these steps to install this node package in your n8n instance:

### Local Installation (Recommended for Development)

1. Clone this repository:
   ```
   git clone https://github.com/j.king/n8n-nodes-kingssh.git
   ```

2. Navigate to the package directory:
   ```
   cd n8n-nodes-kingssh
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Build the package:
   ```
   npm run build
   ```

5. Link the package to your n8n installation:
   ```
   npm link
   ```

6. In your n8n installation directory, run:
   ```
   npm link n8n-nodes-kingssh
   ```

### Global Installation (For Production)

You can install this package directly from npm:

```
npm install -g n8n-nodes-kingssh
```

## Usage

After installation, you'll find the SSH node in the n8n nodes panel under the "Transform" category.

### Setting up SSH Credentials

1. Go to the n8n credentials manager
2. Click on "Create New Credentials"
3. Select "SSH Credentials"
4. Choose your authentication method:
   - **Username & Password**: Enter your SSH server host, port, username, and password
   - **SSH Key**: Enter your SSH server host, port, username, private key, and optional passphrase

### Executing SSH Commands

1. Add the SSH node to your workflow
2. Select "Command" as the resource
3. Select "Execute" as the operation
4. Enter the command you want to execute
5. Select your SSH credentials

The node will return the command output (stdout and stderr).

### Transferring Files

#### Downloading Files

1. Add the SSH node to your workflow
2. Select "File" as the resource
3. Select "Download" as the operation
4. Enter the remote file path
5. Enter the local file path
6. Specify the binary property name
7. Select your SSH credentials

The node will download the file and store it in the specified binary property.

#### Uploading Files

1. Add the SSH node to your workflow
2. Select "File" as the resource
3. Select "Upload" as the operation
4. Enter the remote file path
5. Enter the local file path
6. Specify the binary property name containing the file data
7. Select your SSH credentials

The node will upload the file to the specified remote path.

## Example Workflows

### Execute a Command and Process the Output

This workflow executes a command on a remote server and processes the output:

1. SSH Node:
   - Resource: Command
   - Operation: Execute
   - Command: `ls -la /var/log`

2. Function Node:
   - Code: 
     ```javascript
     return items.map(item => {
       const lines = item.json.stdout.split('\n');
       return { json: { files: lines.filter(line => line.trim() !== '') } };
     });
     ```

### Download a Log File and Parse It

This workflow downloads a log file from a remote server and parses it:

1. SSH Node:
   - Resource: File
   - Operation: Download
   - Remote File Path: `/var/log/syslog`
   - Binary Property Name: `data`

2. Function Node:
   - Code:
     ```javascript
     const binaryData = items[0].binary.data;
     const content = Buffer.from(binaryData.data, 'base64').toString('utf-8');
     const lines = content.split('\n');
     
     return { json: { logLines: lines.filter(line => line.includes('ERROR')) } };
     ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

- J. King