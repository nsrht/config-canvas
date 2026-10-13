import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';

interface EditorProps {
  codeText: string;
  onChange: (value: string) => void;
  isDarkTheme?: boolean;
}

export function JsonEditor({ codeText, onChange, isDarkTheme }: EditorProps) {
  return (
    <div className="h-full w-full overflow-auto border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-[#282c34]">
      <CodeMirror
        value={codeText}
        height="100%"
        extensions={[
          json(),
          linter(jsonParseLinter()),
          lintGutter()
        ]}
        onChange={onChange}
        theme={isDarkTheme ? 'dark' : 'light'}
        className="text-sm font-mono"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          bracketMatching: true,
          autocompletion: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}
