import { spawn } from 'child_process';

export const executeCode = (code: string, language: string): Promise<string> => {
  return new Promise((resolve) => {
    let image = '';
    let command = '';

    if (language === 'javascript') {
      image = 'node:18-alpine';
      command = 'node';
    } else if (language === 'python') {
      image = 'python:3.9-alpine';
      command = 'python';
    } else {
      return resolve('Error: Unsupported language selected.');
    }

    // Windows compatibility adjustment for command execution
    const isWindows = process.platform === 'win32';
    const dockerCmd = isWindows ? 'docker.exe' : 'docker';

    const dockerArgs = [
      'run',
      '--rm',
      '-i',
      '--network', 'none',
      '--memory=128m',
      image,
      command,
      '-'
    ];

    const child = spawn(dockerCmd, dockerArgs);
    let output = '';
    let errorOutput = '';

    child.stdin.write(code);
    child.stdin.end();

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('error', (err) => {
      resolve(`Docker Execution Error: Docker CLI is unavailable to the server process. Install it or add it to PATH. Details: ${err.message}`);
    });

    child.on('close', (exitCode) => {
      if (exitCode !== 0 || errorOutput) {
        resolve(`Execution Output / Error:\n${errorOutput || output || 'Process exited with non-zero code'}`);
      } else {
        resolve(output || 'Process executed successfully with no output.');
      }
    });

    // 5-second timeout safeguard
    setTimeout(() => {
      child.kill();
      resolve('Error: Code execution timed out (5s limit exceeded).');
    }, 5000);
  });
};