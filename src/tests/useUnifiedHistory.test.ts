import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import App from '../App';
import { useUnifiedHistory } from '../hooks/useUnifiedHistory';
import { LosslessNumber } from 'lossless-json';

describe('useUnifiedHistory', () => {
  it('initializes with valid json', () => {
    const { result } = renderHook(() => useUnifiedHistory('{"a": 1}'));
    expect(result.current.currentState.isValid).toBe(true);
    expect(result.current.currentState.parsedData).toEqual({ a: new LosslessNumber('1') });
  });

  it('handles invalid json, preserves text, and keeps last valid parsedData', () => {
    const { result } = renderHook(() => useUnifiedHistory('{"a": 1}'));
    act(() => {
      result.current.updateState('{"a": ', false);
    });
    expect(result.current.currentState.isValid).toBe(false);
    expect(result.current.currentState.text).toBe('{"a": ');
    // Important: Last valid parsedData should be preserved!
    expect(result.current.currentState.parsedData).toEqual({ a: new LosslessNumber('1') });
  });

  it('groups multiple rapid text edits into a single history entry', () => {
    const { result } = renderHook(() => useUnifiedHistory('{"a": 1}'));
    const initialHistoryLength = result.current.canUndo ? 2 : 1; // It starts at 1

    act(() => {
      result.current.updateState('{"a": 12}', false);
    });
    act(() => {
      // Rapid edit within grouping interval
      result.current.updateState('{"a": 123}', false);
    });

    // The length shouldn't have grown by 2, it should have overwritten the last one
    // wait, we can't test history length directly since it's internal,
    // but we can check if undo goes straight back to the original
    act(() => {
      result.current.undo();
    });

    expect(result.current.currentState.text).toBe('{"a": 1}');
  });

  it('preserves array structures including empty and mixed arrays', () => {
    const text = '{"arr": [], "mixed": [1, "two", null, {"nested": []}]}';
    const { result } = renderHook(() => useUnifiedHistory(text));
    expect(result.current.currentState.isValid).toBe(true);
    expect(result.current.currentState.parsedData.arr).toEqual([]);
    expect(result.current.currentState.parsedData.mixed.length).toBe(4);
    expect(result.current.currentState.parsedData.mixed[2]).toBeNull();
  });

  it('preserves unicode and special field names correctly', () => {
    const text = '{"🚀": "unicode", "field-with-dashes": true, "": "empty key"}';
    const { result } = renderHook(() => useUnifiedHistory(text));
    expect(result.current.currentState.isValid).toBe(true);
    expect(result.current.currentState.parsedData['🚀']).toBe('unicode');
    expect(result.current.currentState.parsedData['field-with-dashes']).toBe(true);
    expect(result.current.currentState.parsedData['']).toBe('empty key');
  });

  it('can undo and redo', () => {
    const { result } = renderHook(() => useUnifiedHistory('{"a": 1}'));
    act(() => {
      result.current.updateState('{"a": 2}', false);
    });
    expect(result.current.currentState.text).toBe('{"a": 2}');

    act(() => {
      result.current.undo();
    });
    expect(result.current.currentState.text).toBe('{"a": 1}');

    act(() => {
      result.current.redo();
    });
    expect(result.current.currentState.text).toBe('{"a": 2}');
  });
});
