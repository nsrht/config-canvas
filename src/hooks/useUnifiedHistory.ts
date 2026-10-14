import { useState, useCallback } from 'react';
import { parseJson, stringifyJson } from '../utils/jsonUtils';

export interface HistoryState {
  text: string;
  parsedData: any; // Last known valid data
  isValid: boolean;
  error: string | null;
  timestamp: number;
}

const GROUPING_INTERVAL_MS = 1000;

export function useUnifiedHistory(initialText: string) {
  const [history, setHistory] = useState<HistoryState[]>(() => {
    const { data, isValid, error } = parseJson(initialText);
    return [{ text: initialText, parsedData: data, isValid, error, timestamp: Date.now() }];
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = history[currentIndex];

  const updateState = useCallback((newText: string, fromForm = false) => {
    setHistory((prevHistory) => {
      const current = prevHistory[currentIndex];
      const { data, isValid, error } = parseJson(newText);

      // Keep last valid data if invalid
      const parsedData = isValid ? data : current.parsedData;

      const now = Date.now();
      const newState: HistoryState = { text: newText, parsedData, isValid, error, timestamp: now };

      const newHistory = prevHistory.slice(0, currentIndex + 1);

      // Group with previous if it's from the text editor (not form), valid or invalid,
      // and within the grouping interval
      const isTyping = !fromForm;
      const timeSinceLastEdit = now - current.timestamp;

      if (isTyping && newHistory.length > 1 && timeSinceLastEdit < GROUPING_INTERVAL_MS) {
        newHistory[newHistory.length - 1] = newState;
        return newHistory;
      } else {
        return [...newHistory, newState];
      }
    });

    setHistory(currentHistory => {
        setCurrentIndex(currentHistory.length - 1);
        return currentHistory;
    })
  }, [currentIndex]);

  const undo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const resetToOriginal = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const updateFromForm = useCallback((newData: any) => {
    const newText = stringifyJson(newData);
    updateState(newText, true);
  }, [updateState]);

  return {
    currentState,
    updateState,
    updateFromForm,
    undo,
    redo,
    resetToOriginal,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}
