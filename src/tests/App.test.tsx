import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { FormNode } from '../components/FormNode';
import { LosslessNumber } from 'lossless-json';
import React from 'react';

// Mock CodeMirror to avoid complex browser environment issues
vi.mock('@uiw/react-codemirror', () => {
  return {
    default: ({ value, onChange }: any) => (
      <textarea
        data-testid="mock-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  };
});

// Avoid ResizeObserver errors in jsdom from react-resizable-panels
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('App Components', () => {

  it('renders without crashing and displays header', () => {
    render(<App />);
    expect(screen.getByText('ConfigCanvas')).toBeInTheDocument();
  });

  it('filters nodes based on search query', () => {
    const data = {
      keepThis: 'hello',
      hideThis: 'world',
      nested: {
        keepChild: 123
      }
    };
    const onChange = vi.fn();

    const { rerender } = render(
      <FormNode
        path={[]}
        value={data}
        onChange={onChange}
        isRoot={true}
        searchQuery=""
      />
    );

    // Everything is visible initially
    expect(screen.getByText('keepThis:')).toBeInTheDocument();
    expect(screen.getByText('hideThis:')).toBeInTheDocument();
    expect(screen.getByText('keepChild:')).toBeInTheDocument();

    // Now search for "keep"
    rerender(
      <FormNode
        path={[]}
        value={data}
        onChange={onChange}
        isRoot={true}
        searchQuery="keep"
      />
    );

    expect(screen.getByText('keepThis:')).toBeInTheDocument();
    expect(screen.queryByText('hideThis:')).not.toBeInTheDocument(); // Hidden
    expect(screen.getByText('keepChild:')).toBeInTheDocument(); // Parent object stays visible if child matches
  });

});
