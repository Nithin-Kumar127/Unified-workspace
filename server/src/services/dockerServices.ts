const PISTON_EXECUTE_URL = 'https://emkc.org/api/v2/piston/execute';
const EXECUTION_TIMEOUT_MS = 10_000;

interface PistonExecutionResponse {
  run?: {
    stdout?: string;
    stderr?: string;
    code?: number | null;
  };
}

export class ExecutionServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'ExecutionServiceError';
  }
}

export const executeCode = async (
  code: string,
  language: string,
  stdin = ''
): Promise<string> => {
  if (language !== 'javascript' && language !== 'python') {
    throw new ExecutionServiceError('Unsupported language selected.', 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS);

  try {
    const response = await fetch(PISTON_EXECUTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version: '*',
        files: [{ content: code }],
        stdin,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ExecutionServiceError(
        `Code execution service returned HTTP ${response.status}.`,
        502
      );
    }

    const result = await response.json() as PistonExecutionResponse;
    if (!result.run) {
      throw new ExecutionServiceError('Code execution service returned an invalid response.', 502);
    }

    const stdout = result.run.stdout ?? '';
    const stderr = result.run.stderr ?? '';
    if (result.run.code !== 0 || stderr) {
      return `Execution Output / Error:\n${stderr || stdout || 'Process exited with non-zero code'}`;
    }

    return stdout || 'Process executed successfully with no output.';
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ExecutionServiceError('Code execution timed out (10s limit exceeded).', 504);
    }
    if (error instanceof ExecutionServiceError) throw error;
    throw new ExecutionServiceError('Could not reach the code execution service.', 502);
  } finally {
    clearTimeout(timeout);
  }
};