import React, { useState, useCallback, useMemo } from 'react';
import { isLosslessNumber, isSafeNumber } from '../utils/jsonUtils';
import { ChevronDown, ChevronRight, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { LosslessNumber } from 'lossless-json';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type JsonValue = any;

export type JsonPath = (string | number)[];

interface BaseProps {
  name?: string;
  path: JsonPath;
  value: JsonValue;
  onChange: (path: JsonPath, newValue: JsonValue) => void;
  onDelete?: (path: JsonPath) => void;
  isRoot?: boolean;
  searchQuery?: string;
}

export function FormNode({ name, path, value, onChange, onDelete, isRoot, searchQuery = '' }: BaseProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const normalizedQuery = searchQuery.toLowerCase();

  // Basic search matching on name, path, or scalar values
  const stringifiedPath = useMemo(() => path.join('.'), [path]);

  const matchesSearch = useMemo(() => {
    if (!normalizedQuery) return true;

    if (name && name.toLowerCase().includes(normalizedQuery)) return true;
    if (stringifiedPath && stringifiedPath.toLowerCase().includes(normalizedQuery)) return true;

    if (value === null && 'null'.includes(normalizedQuery)) return true;
    if (typeof value === 'boolean' && value.toString().includes(normalizedQuery)) return true;
    if (typeof value === 'string' && value.toLowerCase().includes(normalizedQuery)) return true;
    if (typeof value === 'number' && value.toString().includes(normalizedQuery)) return true;
    if (isLosslessNumber(value) && value.toString().includes(normalizedQuery)) return true;

    return false;
  }, [name, path, value, normalizedQuery]);

  // If this node doesn't match and it's a scalar, we might want to hide it.
  // But wait, what if it's an object/array? We need to know if any children match to keep it visible.
  // Instead of doing deep checking which might be slow, we'll just filter during rendering of ObjectNode and ArrayNode.

  if (value === null) {
    if (normalizedQuery && !matchesSearch) return null;
    return <NullNode name={name} path={path} onChange={onChange} onDelete={onDelete} />;
  }

  if (Array.isArray(value)) {
    return (
      <ArrayNode
        name={name}
        path={path}
        value={value}
        onChange={onChange}
        onDelete={onDelete}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isRoot={isRoot}
        searchQuery={searchQuery}
        matchesSearch={matchesSearch}
      />
    );
  }

  if (typeof value === 'object' && !isLosslessNumber(value)) {
    return (
      <ObjectNode
        name={name}
        path={path}
        value={value}
        onChange={onChange}
        onDelete={onDelete}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isRoot={isRoot}
        searchQuery={searchQuery}
        matchesSearch={matchesSearch}
      />
    );
  }

  if (normalizedQuery && !matchesSearch) return null;

  if (typeof value === 'boolean') {
    return <BooleanNode name={name} path={path} value={value} onChange={onChange} onDelete={onDelete} />;
  }

  if (typeof value === 'string') {
    return <StringNode name={name} path={path} value={value} onChange={onChange} onDelete={onDelete} />;
  }

  if (typeof value === 'number' || isLosslessNumber(value)) {
    return <NumberNode name={name} path={path} value={value} onChange={onChange} onDelete={onDelete} />;
  }

  return <div>Unknown type for {name || path}</div>;
}

function deepMatch(value: any, query: string, path: JsonPath): boolean {
  if (!query) return true;
  const pathStr = path.join('.');
  if (pathStr.toLowerCase().includes(query)) return true;

  if (value === null) return 'null'.includes(query);
  if (typeof value === 'boolean') return value.toString().includes(query);
  if (typeof value === 'string') return value.toLowerCase().includes(query);
  if (typeof value === 'number' || isLosslessNumber(value)) return value.toString().includes(query);

  if (Array.isArray(value)) {
    return value.some((v, i) => deepMatch(v, query, [...path, i]));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).some(([k, v]) => k.toLowerCase().includes(query) || deepMatch(v, query, [...path, k]));
  }

  return false;
}

function FieldLabel({ name, path, onDelete, children, onToggle, isExpanded }: any) {
  return (
    <div className="flex items-center group py-1">
      {onToggle && (
        <button onClick={onToggle} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      )}
      {name !== undefined && <span className="font-medium text-sm text-gray-700 dark:text-gray-300 min-w-24">{name}:</span>}
      <div className="flex-1 ml-2">{children}</div>
      {onDelete && (
        <button
          onClick={() => onDelete(path)}
          className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
          title="Delete field"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function ObjectNode({ name, path, value, onChange, onDelete, isExpanded, setIsExpanded, isRoot, searchQuery, matchesSearch }: any) {
  const keys = Object.keys(value);
  const normalizedQuery = searchQuery.toLowerCase();

  const hasMatchingChildren = useMemo(() => {
    if (!normalizedQuery) return true;
    return deepMatch(value, normalizedQuery, path);
  }, [value, normalizedQuery, path]);

  if (normalizedQuery && !matchesSearch && !hasMatchingChildren) {
    return null;
  }

  // Auto-expand if searching and there are matches inside
  const shouldExpand = searchQuery ? true : isExpanded;

  const handleChildChange = (childPath: JsonPath, newValue: JsonValue) => {
    const key = childPath[childPath.length - 1];
    onChange(path, { ...value, [key]: newValue });
  };

  const handleChildDelete = (childPath: JsonPath) => {
    const key = childPath[childPath.length - 1] as string;
    const newValue = { ...value };
    delete newValue[key];
    onChange(path, newValue);
  };

  const handleAddField = () => {
    const newKey = window.prompt('Enter new field name:');
    if (newKey && !(newKey in value)) {
      onChange(path, { ...value, [newKey]: "" });
      setIsExpanded(true);
    }
  };

  return (
    <div className={cn("flex flex-col", !isRoot && "pl-4 border-l border-gray-200 dark:border-gray-700 my-1")}>
      {!isRoot && (
        <div className="flex items-center gap-2 group">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{name || '{...}'}</span>
          <span className="text-xs text-gray-500">{keys.length} items</span>
          {onDelete && (
             <button onClick={() => onDelete(path)} className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity">
               <Trash2 size={14} />
             </button>
          )}
        </div>
      )}

      {shouldExpand && (
        <div className={cn(isRoot ? "" : "pl-6 mt-1")}>
          {keys.map((key) => (
            <FormNode
              key={key}
              name={key}
              path={[...path, key]}
              value={value[key]}
              onChange={handleChildChange}
              onDelete={handleChildDelete}
              searchQuery={searchQuery}
            />
          ))}
          <button
            onClick={handleAddField}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2 py-1 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 w-fit"
          >
            <Plus size={14} /> Add Field
          </button>
        </div>
      )}
    </div>
  );
}

function ArrayNode({ name, path, value, onChange, onDelete, isExpanded, setIsExpanded, isRoot, searchQuery, matchesSearch }: any) {
  const normalizedQuery = searchQuery.toLowerCase();

  const hasMatchingChildren = useMemo(() => {
    if (!normalizedQuery) return true;
    return deepMatch(value, normalizedQuery, path);
  }, [value, normalizedQuery, path]);

  if (normalizedQuery && !matchesSearch && !hasMatchingChildren) {
    return null;
  }

  const shouldExpand = searchQuery ? true : isExpanded;

  const handleItemChange = (index: number, newValue: JsonValue) => {
    const newArray = [...value];
    newArray[index] = newValue;
    onChange(path, newArray);
  };

  const handleItemDelete = (index: number) => {
    const newArray = [...value];
    newArray.splice(index, 1);
    onChange(path, newArray);
  };

  const moveItem = (index: number, direction: 1 | -1) => {
    if (index + direction < 0 || index + direction >= value.length) return;
    const newArray = [...value];
    const temp = newArray[index];
    newArray[index] = newArray[index + direction];
    newArray[index + direction] = temp;
    onChange(path, newArray);
  };

  const handleAddItem = () => {
    onChange(path, [...value, ""]);
    setIsExpanded(true);
  };

  return (
    <div className={cn("flex flex-col", !isRoot && "pl-4 border-l border-gray-200 dark:border-gray-700 my-1")}>
      {!isRoot && (
        <div className="flex items-center gap-2 group">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{name || '[...]'}</span>
          <span className="text-xs text-gray-500">{value.length} items</span>
          {onDelete && (
             <button onClick={() => onDelete(path)} className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity">
               <Trash2 size={14} />
             </button>
          )}
        </div>
      )}

      {shouldExpand && (
        <div className={cn(isRoot ? "" : "pl-6 mt-1")}>
          {value.map((item: any, index: number) => (
            <div key={index} className="flex group/item items-start gap-2 mb-2">
              <div className="flex-1 w-full min-w-0">
                <FormNode
                  path={[...path, index]}
                  value={item}
                  onChange={(p, val) => handleItemChange(index, val)}
                  searchQuery={searchQuery}
                />
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity pt-1">
                 <button onClick={() => moveItem(index, -1)} disabled={index === 0} className="p-1 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700">
                   <ArrowUp size={12} />
                 </button>
                 <button onClick={() => moveItem(index, 1)} disabled={index === value.length - 1} className="p-1 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700">
                   <ArrowDown size={12} />
                 </button>
                 <button onClick={() => handleItemDelete(index)} className="p-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded hover:bg-red-100 dark:hover:bg-red-900/40">
                   <Trash2 size={12} />
                 </button>
              </div>
            </div>
          ))}
          <button
            onClick={handleAddItem}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2 py-1 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 w-fit"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>
      )}
    </div>
  );
}

function StringNode({ name, path, value, onChange, onDelete }: any) {
  return (
    <FieldLabel name={name} path={path} onDelete={onDelete}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(path, e.target.value)}
        className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </FieldLabel>
  );
}

function NumberNode({ name, path, value, onChange, onDelete }: any) {
  const safe = isSafeNumber(value);
  const strValue = value.toString();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(path, new LosslessNumber('0'));
      return;
    }
    try {
      onChange(path, new LosslessNumber(val));
    } catch {
      // Invalid number, just let them type (might be intermediate like '-')
      // Or in a real app we'd keep local string state. For simplicity, we only pass up valid LosslessNumbers
    }
  };

  return (
    <FieldLabel name={name} path={path} onDelete={onDelete}>
      <div className="flex flex-col gap-1">
        <input
          type="text"
          value={strValue}
          onChange={handleChange}
          readOnly={!safe}
          className={cn(
            "w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border rounded outline-none",
            !safe ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 opacity-80 cursor-not-allowed"
                  : "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          )}
        />
        {!safe && (
          <span className="text-xs text-red-500 dark:text-red-400">
            Number cannot be safely edited due to precision limits.
          </span>
        )}
      </div>
    </FieldLabel>
  );
}

function BooleanNode({ name, path, value, onChange, onDelete }: any) {
  return (
    <FieldLabel name={name} path={path} onDelete={onDelete}>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={value}
          onChange={(e) => onChange(path, e.target.checked)}
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{value ? 'true' : 'false'}</span>
      </label>
    </FieldLabel>
  );
}

function NullNode({ name, path, onChange, onDelete }: any) {
  const handleConvert = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    switch (type) {
      case 'string': onChange(path, ""); break;
      case 'number': onChange(path, new LosslessNumber('0')); break;
      case 'boolean': onChange(path, false); break;
      case 'object': onChange(path, {}); break;
      case 'array': onChange(path, []); break;
    }
  };

  return (
    <FieldLabel name={name} path={path} onDelete={onDelete}>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-mono">null</span>
        <select
          onChange={handleConvert}
          value=""
          className="text-xs border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-1 outline-none"
        >
          <option value="" disabled>Change Type...</option>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="object">Object</option>
          <option value="array">Array</option>
        </select>
      </div>
    </FieldLabel>
  );
}
