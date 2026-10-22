const RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com';
const PUBLIC_HOST = 'ce.judge0.com';
const EXECUTION_TIMEOUT_MS = 15_000;
const CPU_TIME_LIMIT_SECONDS = 2;
const CPU_EXTRA_TIME_SECONDS = 1;
const WALL_TIME_LIMIT_SECONDS = 5;

const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63, // Node.js
  python: 71,     // Python 3
};

interface Judge0Response {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: { id: number; description: string };
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
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new ExecutionServiceError('Unsupported language selected.', 400);
  }

  // With a RapidAPI key -> RapidAPI Judge0 (reliable).
  // Without one -> free public Judge0 instance (rate-limited, fine for demos).
  const apiKey = process.env.JUDGE0_KEY;
  const host = apiKey ? RAPIDAPI_HOST : PUBLIC_HOST;
  const url = `https://${host}/submissions?base64_encoded=false&wait=true`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['X-RapidAPI-Key'] = apiKey;
    headers['X-RapidAPI-Host'] = RAPIDAPI_HOST;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin,
        cpu_time_limit: CPU_TIME_LIMIT_SECONDS,
        cpu_extra_time: CPU_EXTRA_TIME_SECONDS,
        wall_time_limit: WALL_TIME_LIMIT_SECONDS,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ExecutionServiceError(
        `Code execution service returned HTTP ${response.status}.`,
        502
      );
    }

    const result = (await response.json()) as Judge0Response;
    if (!result.status) {
      throw new ExecutionServiceError('Code execution service returned an invalid response.', 502);
    }

    const statusId = result.status.id;

    if (statusId === 5) {
      return 'Execution Output / Error:\nTime limit exceeded. Execution was stopped to prevent it from running indefinitely.';
    }

    if (statusId === 3) {
      return result.stdout || 'Process executed successfully with no output.';
    }

    const errorText =
      result.compile_output ||
      result.stderr ||
      result.message ||
      result.stdout ||
      result.status.description;
    return `Execution Output / Error:\n${errorText}`;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ExecutionServiceError('Code execution timed out.', 504);
    }
    if (error instanceof ExecutionServiceError) throw error;
    throw new ExecutionServiceError('Could not reach the code execution service.', 502);
  } finally {
    clearTimeout(timeout);
  }
};