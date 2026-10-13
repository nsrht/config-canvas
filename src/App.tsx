import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUnifiedHistory } from './hooks/useUnifiedHistory';
import { FormNode } from './components/FormNode';
import { JsonEditor } from './components/JsonEditor';
import { DiffView } from './components/DiffView';
import { downloadFile, handleFileUpload } from './utils/fileUtils';
import { exampleFiles } from './utils/examples';
import { stringifyJson, setIn } from './utils/jsonUtils';
import {
  Undo, Redo, RotateCcw, Download, Upload,
  FileJson, Columns, ListTree, Code, Columns3, Moon, Sun, Monitor, Search
} from 'lucide-react';
import { cn } from './components/FormNode';

type ViewMode = 'form' | 'code' | 'split' | 'diff';

export default function App() {
  const [initialFileText, setInitialFileText] = useState(exampleFiles[1].content);
  const [fileName, setFileName] = useState('config.json');

  const {
    currentState,
    updateState,
    updateFromForm,
    undo,
    redo,
    resetToOriginal,
    canUndo,
    canRedo,
  } = useUnifiedHistory(initialFileText);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, (content, name) => {
        setInitialFileText(content);
        setFileName(name);
        // Reset history by re-creating it or forcing an update to state.
        // For simplicity, we just set the new state which acts as a new history item.
        // A full reset would ideally clear history, but let's just update the root state.
        // To properly reset, we'd probably want to lift history state or use a key on the main component.
      });
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      <AppContent
        key={initialFileText}
        initialText={initialFileText}
        fileName={fileName}
        setFileName={setFileName}
        onUploadClick={handleUploadClick}
        onExampleSelect={(content: string, name: string) => {
          setInitialFileText(content);
          setFileName(name);
        }}
      />
    </>
  );
}

function AppContent({
  initialText,
  fileName,
  setFileName,
  onUploadClick,
  onExampleSelect
}: {
  initialText: string,
  fileName: string,
  setFileName: (s: string) => void,
  onUploadClick: () => void,
  onExampleSelect: (c: string, n: string) => void
}) {
  const {
    currentState,
    updateState,
    updateFromForm,
    undo,
    redo,
    resetToOriginal,
    canUndo,
    canRedo,
  } = useUnifiedHistory(initialText);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('form');
    } else if (!isMobile && (viewMode === 'form' || viewMode === 'code')) {
      setViewMode('split');
    }
  }, [isMobile]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const [searchQuery, setSearchQuery] = useState('');

  const handleEditorChange = useCallback((value: string) => {
    updateState(value, false);
  }, [updateState]);

  const handleFormChange = useCallback((path: string, newValue: any) => {
    if (!currentState.isValid) return; // Ignore form changes if current state is invalid JSON

    // Simple update logic for form root
    if (path === '') {
      updateFromForm(newValue);
      return;
    }

    const parts = path.split(/\.|\[|\]/).filter(Boolean);
    const newData = setIn(currentState.parsedData, parts, newValue);

    updateFromForm(newData);
  }, [currentState, updateFromForm]);

  const handleFormat = () => {
    if (currentState.isValid) {
      const formatted = stringifyJson(currentState.parsedData);
      updateState(formatted, false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors">
      {/* Toolbar */}
      <header className="flex flex-wrap items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileJson className="text-blue-600 dark:text-blue-400" />
            <h1 className="font-bold text-lg hidden sm:block">ConfigCanvas</h1>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          <div className="flex items-center gap-2 text-sm ml-2 mr-4">
            <button onClick={onUploadClick} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <Upload size={14} /> Upload
            </button>
            <select
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border-none outline-none cursor-pointer"
              onChange={(e) => {
                if(e.target.value) {
                  const ex = exampleFiles[parseInt(e.target.value)];
                  onExampleSelect(ex.content, ex.name);
                }
              }}
              value=""
            >
              <option value="" disabled>Examples</option>
              {exampleFiles.map((ex, i) => (
                <option key={i} value={i}>{ex.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
             <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" title="Undo">
               <Undo size={18} />
             </button>
             <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" title="Redo">
               <Redo size={18} />
             </button>
             <button onClick={resetToOriginal} disabled={!canUndo} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 ml-1" title="Reset to Original">
               <RotateCcw size={18} />
             </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           {!isMobile && (
             <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded mr-2">
               <button onClick={() => setViewMode('split')} className={cn("p-1.5 rounded", viewMode === 'split' ? "bg-white dark:bg-gray-600 shadow" : "")} title="Split View">
                 <Columns3 size={16} />
               </button>
               <button onClick={() => setViewMode('diff')} className={cn("p-1.5 rounded", viewMode === 'diff' ? "bg-white dark:bg-gray-600 shadow" : "")} title="Diff View">
                 <Columns size={16} />
               </button>
             </div>
           )}

           {isMobile && (
             <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded mr-2">
               <button onClick={() => setViewMode('form')} className={cn("p-1.5 rounded", viewMode === 'form' ? "bg-white dark:bg-gray-600 shadow" : "")} title="Form View">
                 <ListTree size={16} />
               </button>
               <button onClick={() => setViewMode('code')} className={cn("p-1.5 rounded", viewMode === 'code' ? "bg-white dark:bg-gray-600 shadow" : "")} title="Code View">
                 <Code size={16} />
               </button>
               <button onClick={() => setViewMode('diff')} className={cn("p-1.5 rounded", viewMode === 'diff' ? "bg-white dark:bg-gray-600 shadow" : "")} title="Diff View">
                 <Columns size={16} />
               </button>
             </div>
           )}

           <button onClick={() => handleFormat()} disabled={!currentState.isValid} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50">
             Format
           </button>

           <button onClick={() => downloadFile(fileName, currentState.text)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded">
             <Download size={16} /> <span className="hidden sm:inline">Download</span>
           </button>

           <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

         {/* Invalid Warning overlay for Form view */}
         {!currentState.isValid && (viewMode === 'form' || viewMode === 'split') && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-2 rounded shadow-lg flex flex-col items-center">
              <span className="font-bold text-sm">Invalid JSON syntax</span>
              <span className="text-xs">Form synchronization paused. Fix code to resume.</span>
            </div>
         )}

         {(viewMode === 'form' || viewMode === 'split') && (
            <div className={cn("flex flex-col h-full overflow-auto bg-white dark:bg-gray-800 p-4 relative", viewMode === 'split' ? "w-1/2 border-r border-gray-200 dark:border-gray-700" : "w-full")}>

               <div className="mb-4 relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-4 w-4 text-gray-400" />
                 </div>
                 <input
                   type="text"
                   placeholder="Search field, path, or value..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                 />
               </div>

               {!currentState.isValid && (
                 <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-0 pointer-events-none mt-14"></div>
               )}
               <div className={cn("flex-1", !currentState.isValid && "pointer-events-none opacity-60")}>
                  {currentState.parsedData !== null && currentState.parsedData !== undefined ? (
                    <FormNode
                      path=""
                      value={currentState.parsedData}
                      onChange={handleFormChange}
                      isRoot={true}
                      searchQuery={searchQuery}
                    />
                  ) : (
                    <div className="text-gray-500 italic p-4">No valid data to display.</div>
                  )}
               </div>
            </div>
         )}

         {(viewMode === 'code' || viewMode === 'split') && (
            <div className={cn("h-full", viewMode === 'split' ? "w-1/2" : "w-full")}>
              <JsonEditor codeText={currentState.text} onChange={handleEditorChange} isDarkTheme={isDarkMode} />
            </div>
         )}

         {viewMode === 'diff' && (
            <div className="w-full h-full p-4 bg-gray-100 dark:bg-gray-900 overflow-hidden">
               <DiffView originalText={initialText} currentText={currentState.isValid ? stringifyJson(currentState.parsedData) : currentState.text} isInvalid={!currentState.isValid} />
            </div>
         )}

      </main>
    </div>
  );
}
