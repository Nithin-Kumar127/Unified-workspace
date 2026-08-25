// client/src/components/CodeEditor.tsx
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
}

export default function CodeEditor({ code, onChange, language = 'javascript' }: CodeEditorProps) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}