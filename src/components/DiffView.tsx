import React, { useMemo, useState } from 'react';
import * as Diff from 'diff';
import { cn } from './FormNode';

interface DiffViewProps {
  originalText: string;
  currentText: string;
  isInvalid: boolean;
}

export function DiffView({ originalText, currentText, isInvalid }: DiffViewProps) {
  const [ignoreFormatting, setIgnoreFormatting] = useState(false);

  const diffResult = useMemo(() => {
    let t1 = originalText;
    // When isInvalid is true, we want to show the diff against the last valid state.
    // The parent now passes the stringified valid data as currentText in that case.
    let t2 = currentText;

    if (ignoreFormatting) {
      try {
         // Attempt to format both if valid JSON to compare structure, or just strip whitespaces
         // For simplicity and robust parsing, stripping whitespaces for comparison.
         t1 = t1.replace(/\s+/g, '');
         t2 = t2.replace(/\s+/g, '');
         // In a real app we might parse and stringify if valid to get canonical JSON, but whitespace stripping works well for ignoring formatting.
      } catch (e) {
         // Ignore
      }
    }

    return Diff.diffLines(t1, t2);
  }, [originalText, currentText, ignoreFormatting]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
      <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Changes</span>
          {isInvalid && (
            <span className="text-amber-600 dark:text-amber-400 font-medium text-xs bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
              Showing last valid state
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreFormatting}
            onChange={(e) => setIgnoreFormatting(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Ignore formatting (whitespaces)
        </label>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {diffResult.map((part, index) => (
          <span
            key={index}
            className={cn(
              part.added && "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 block w-full px-1",
              part.removed && "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 block w-full px-1 line-through",
              !part.added && !part.removed && "text-gray-600 dark:text-gray-400 block w-full px-1 whitespace-pre-wrap"
            )}
          >
            {part.value}
          </span>
        ))}
        {diffResult.length === 1 && !diffResult[0].added && !diffResult[0].removed && (
          <div className="text-gray-500 italic text-center mt-4">No changes detected.</div>
        )}
      </div>
    </div>
  );
}
