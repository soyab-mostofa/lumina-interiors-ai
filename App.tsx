import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  Wand2,
  RefreshCcw,
  Download,
  ImagePlus,
  Palette,
  Loader2,
  ArrowRight,
  Check,
  Sparkles,
  MonitorPlay,
  Stars,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  CheckCircle,
  Home,
  Building2,
  Keyboard,
  X
} from 'lucide-react';
import { AppState, DESIGN_STYLES, RoomAnalysis, ChatMessage } from './types';
import { analyzeRoomImage, redesignRoomImage, generateNewImage, fileToBase64, extractBase64 } from './services/geminiService';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { AnalysisPanel } from './components/AnalysisPanel';
import { DesignerChat } from './components/DesignerChat';
import { ToastContainer, useToast } from './components/Toast';
import { ProgressBar } from './components/ProgressBar';
import { AnalysisSkeleton, StyleCardSkeleton } from './components/SkeletonLoader';

enum Tab {
  REDESIGN = 'redesign',
  GENERATE = 'generate'
}

const STEPS = [
  { number: 1, title: 'Upload' },
  { number: 2, title: 'Analyze' },
  { number: 3, title: 'Style' },
  { number: 4, title: 'Result' }
];

type RoomContextType = 'Residential' | 'Commercial';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const App: React.FC = () => {
  // --- Toast System ---
  const toast = useToast();

  // --- Global State ---
  const [activeTab, setActiveTab] = useState<Tab>(Tab.REDESIGN);

  // --- Redesign Tab State (Persisted) ---
  const [redesignState, setRedesignState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedRedesign, setGeneratedRedesign] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // --- Upload & Context Flow State ---
  const [showContextModal, setShowContextModal] = useState(false);
  const [tempUploadedFile, setTempUploadedFile] = useState<File | null>(null);
  const [roomContext, setRoomContext] = useState<RoomContextType>('Residential');

  // --- Drag and Drop State ---
  const [isDragging, setIsDragging] = useState(false);

  // --- Keyboard Shortcuts State ---
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // --- Generate New Tab State (Persisted) ---
  const [generateState, setGenerateState] = useState<AppState>(AppState.IDLE);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generatedNewImage, setGeneratedNewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup URL.createObjectURL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (originalImage) {
        URL.revokeObjectURL(originalImage);
      }
    };
  }, [originalImage]);

  // Cleanup on unmount - abort any in-flight requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K = Show shortcuts modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }

      // Cmd/Ctrl + U = Upload file
      if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
        e.preventDefault();
        if (activeTab === Tab.REDESIGN && redesignState === AppState.IDLE) {
          fileInputRef.current?.click();
        }
      }

      // Cmd/Ctrl + Enter = Generate/Redesign
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === Tab.REDESIGN && redesignState === AppState.SELECTION) {
          handleRedesign();
        } else if (activeTab === Tab.GENERATE && generatePrompt.trim()) {
          handleGenerateNew();
        }
      }

      // Cmd/Ctrl + / = Toggle chat
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        if (redesignState === AppState.COMPLETE) {
          setIsChatOpen(prev => !prev);
        }
      }

      // Cmd/Ctrl + R = Reset
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        resetRedesign();
      }

      // Escape = Close modals
      if (e.key === 'Escape') {
        setShowKeyboardShortcuts(false);
        setShowContextModal(false);
        if (isChatOpen) {
          setIsChatOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, redesignState, generatePrompt, isChatOpen]);

  // --- Computed Step for Redesign ---
  const getCurrentRedesignStep = () => {
    if (redesignState === AppState.IDLE && !originalImage) return 1;
    if (redesignState === AppState.ANALYZING) return 2;
    if (redesignState === AppState.SELECTION || (redesignState === AppState.GENERATING && !generatedRedesign)) return 3;
    if (redesignState === AppState.COMPLETE) return 4;
    return 1;
  };

  // --- File Validation ---
  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', 'Please upload an image file (JPG, PNG, etc.)');
      return false;
    }

    // Check file size (10MB max)
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', `Maximum file size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return false;
    }

    return true;
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setTempUploadedFile(file);
        setShowContextModal(true);
      }
    }
  };

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = '';
      return;
    }

    // Store file and show modal
    setTempUploadedFile(file);
    setShowContextModal(true);
    // Clear input so same file can be selected again if cancelled
    e.target.value = '';
  };

  const handleContextSelection = async (context: RoomContextType) => {
    if (!tempUploadedFile) return;

    setRoomContext(context);
    setShowContextModal(false);

    toast.info('Starting analysis', `Analyzing your ${context.toLowerCase()} space...`);

    // Start Analysis Flow
    setRedesignState(AppState.ANALYZING);
    setOriginalImage(URL.createObjectURL(tempUploadedFile));
    setAnalysis(null);
    setGeneratedRedesign(null);
    setSelectedStyleId(null);
    setChatMessages([]);
    setActiveTab(Tab.REDESIGN); // Ensure we are on the right tab

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const base64 = await fileToBase64(tempUploadedFile);
      setOriginalImageBase64(base64);

      // Trigger Analysis with Context Hint
      const result = await analyzeRoomImage(base64, context, abortControllerRef.current.signal);
      setAnalysis(result);
      setRedesignState(AppState.SELECTION);
      toast.success('Analysis complete!', 'Room analyzed successfully. Choose your style below.');
    } catch (err) {
      console.error('Analysis failed:', err);
      const message = err instanceof Error ? err.message : "Failed to analyze image. Please try again.";
      toast.error('Analysis failed', message);
      setRedesignState(AppState.IDLE);
    } finally {
      setTempUploadedFile(null);
      abortControllerRef.current = null;
    }
  };

  const handleRedesign = async () => {
    if (!originalImageBase64 || redesignState === AppState.GENERATING) return;

    let finalPrompt = '';

    if (selectedStyleId?.startsWith('suggested-')) {
      // Handle AI suggested prompt
      const index = parseInt(selectedStyleId.split('-')[1]);
      if (analysis?.suggestedPrompts[index]) {
        finalPrompt = analysis.suggestedPrompts[index].prompt;
      }
    } else if (selectedStyleId === 'custom') {
      if (!customPrompt.trim()) {
        toast.error('Missing prompt', 'Please enter a custom prompt.');
        return;
      }
      finalPrompt = customPrompt;
    } else if (selectedStyleId) {
      // Handle Standard Preset
      const style = DESIGN_STYLES.find(s => s.id === selectedStyleId);
      if (style) finalPrompt = style.promptSuffix;
    } else {
      toast.error('No style selected', 'Please select a style.');
      return;
    }

    setRedesignState(AppState.GENERATING);
    toast.info('Generating design', 'Creating your transformation...');

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const resultImage = await redesignRoomImage(originalImageBase64, finalPrompt, abortControllerRef.current.signal);
      setGeneratedRedesign(resultImage);
      setRedesignState(AppState.COMPLETE);
      toast.success('Design complete!', 'Your transformation is ready. Drag the slider to compare.');
    } catch (err) {
      console.error('Redesign failed:', err);
      const message = err instanceof Error ? err.message : "Failed to generate redesign. Please try again.";
      toast.error('Redesign failed', message);
      setRedesignState(AppState.SELECTION);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleChatTriggeredRedesign = async (prompt: string) => {
      if (!originalImageBase64) return;

      setRedesignState(AppState.GENERATING);
      toast.info('Updating design', 'Applying your feedback...');

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        // We use the ORIGINAL image as base for better quality, but the prompt
        // from the Chat AI is smart enough to include "Keep current changes" logic if needed.
        // For a truly iterative flow, we might want to use generatedRedesign,
        // but re-generating from original is often cleaner to avoid artifact compounding.
        // The Chat prompt logic (State Manager) handles the cumulative state.
        const resultImage = await redesignRoomImage(originalImageBase64, prompt, abortControllerRef.current.signal);
        setGeneratedRedesign(resultImage);
        setRedesignState(AppState.COMPLETE);
        toast.success('Design updated!', 'Your changes have been applied.');
      } catch (err) {
        console.error('Chat-triggered redesign failed:', err);
        const message = err instanceof Error ? err.message : "Failed to update design from chat.";
        toast.error('Update failed', message);
        // Don't set to COMPLETE on error - keep it in current state or revert
        setRedesignState(generatedRedesign ? AppState.COMPLETE : AppState.SELECTION);
      } finally {
        abortControllerRef.current = null;
      }
  };

  const handleGenerateNew = async () => {
    if (!generatePrompt.trim() || generateState === AppState.GENERATING) {
      if (!generatePrompt.trim()) {
        toast.error('Missing description', 'Please describe the image you want to generate.');
      }
      return;
    }

    setGenerateState(AppState.GENERATING);
    toast.info('Generating image', 'Creating your concept from scratch...');

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const resultImage = await generateNewImage(generatePrompt, abortControllerRef.current.signal);
      setGeneratedNewImage(resultImage);
      setGenerateState(AppState.COMPLETE);
      toast.success('Image generated!', 'Your concept is ready to download.');
    } catch (err) {
      console.error('Image generation failed:', err);
      const message = err instanceof Error ? err.message : "Failed to generate image. Please try again.";
      toast.error('Generation failed', message);
      setGenerateState(AppState.IDLE);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const resetRedesign = () => {
    setRedesignState(AppState.IDLE);
    setOriginalImage(null);
    setOriginalImageBase64(null);
    setAnalysis(null);
    setGeneratedRedesign(null);
    setSelectedStyleId(null);
    setCustomPrompt('');
    setChatMessages([]);
    setIsChatOpen(false);
    setTempUploadedFile(null);
  };

  // --- Components ---

  const KeyboardShortcutsModal = () => {
    if (!showKeyboardShortcuts) return null;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? '⌘' : 'Ctrl';

    const shortcuts = [
      { keys: `${modKey} + K`, description: 'Show keyboard shortcuts' },
      { keys: `${modKey} + U`, description: 'Upload image' },
      { keys: `${modKey} + Enter`, description: 'Generate/Redesign' },
      { keys: `${modKey} + /`, description: 'Toggle designer chat' },
      { keys: `${modKey} + R`, description: 'Reset and start over' },
      { keys: 'Esc', description: 'Close modals' },
    ];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowKeyboardShortcuts(false)}></div>
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-scale-in border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-3 rounded-xl text-white shadow-sm">
                <Keyboard size={22} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={() => setShowKeyboardShortcuts(false)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                <span className="text-slate-700 font-medium group-hover:text-slate-900">{shortcut.description}</span>
                <kbd className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-mono text-sm border border-slate-200 shadow-sm group-hover:border-slate-300 transition-colors">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Press <kbd className="px-2.5 py-1.5 bg-slate-100 rounded-lg text-slate-700 font-mono text-xs border border-slate-200">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ContextSelectionModal = () => {
    if (!showContextModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowContextModal(false)}></div>
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 animate-scale-in">
          <div className="text-center mb-8">
             <h2 className="text-2xl font-bold text-slate-900">What kind of space is this?</h2>
             <p className="text-slate-500 mt-2">Helping us understand the context improves our suggestions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <button
               onClick={() => handleContextSelection('Residential')}
               className="group relative bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-900 hover:shadow-lg rounded-2xl p-8 transition-all duration-300 text-left"
             >
                <div className="w-16 h-16 bg-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-slate-700 group-hover:text-slate-900 group-hover:scale-105 transition-all mb-6">
                   <Home size={32} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Residential</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Living rooms, bedrooms, kitchens, apartments, and personal spaces.</p>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-900">
                   <CheckCircleIcon size={24} />
                </div>
             </button>

             <button
               onClick={() => handleContextSelection('Commercial')}
               className="group relative bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-900 hover:shadow-lg rounded-2xl p-8 transition-all duration-300 text-left"
             >
                <div className="w-16 h-16 bg-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-slate-700 group-hover:text-slate-900 group-hover:scale-105 transition-all mb-6">
                   <Building2 size={32} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Commercial</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Offices, retail stores, lobbies, co-working spaces, and business environments.</p>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-900">
                   <CheckCircleIcon size={24} />
                </div>
             </button>
          </div>
        </div>
      </div>
    );
  };

  const StepIndicator = () => {
    const currentStep = getCurrentRedesignStep();
    return (
      <div className="flex justify-center mb-12 animate-fade-in">
        <div className="flex items-center space-x-2 md:space-x-6 bg-white border border-slate-200 px-8 py-4 rounded-full shadow-sm">
          {STEPS.map((step) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold border-2 transition-all duration-300
                ${currentStep >= step.number ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-400 bg-white'}
              `}>
                {currentStep > step.number ? <Check size={14} strokeWidth={3} /> : step.number}
              </div>
              <span className={`ml-3 text-sm font-bold hidden md:block ${currentStep >= step.number ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.title}
              </span>
              {step.number < 4 && <div className={`w-6 md:w-10 h-0.5 ml-3 md:ml-6 transition-colors duration-300 ${currentStep > step.number ? 'bg-slate-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRedesignFlow = () => {
    // IDLE / UPLOAD
    if (redesignState === AppState.IDLE || (redesignState === AppState.ANALYZING && !originalImage)) {
        return (
            <div className="animate-slide-up max-w-5xl mx-auto px-6 py-10">
              <div className="text-center mb-16 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold mb-2">
                  <Stars size={16} className="text-slate-600" />
                  <span>AI-Powered Interior Designer</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                  Redesign your space <br />
                  <span className="text-slate-900">in seconds</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Upload a photo and let our AI analyze your room, suggest tailored improvements, and visualize your dream interior instantly.
                </p>
              </div>

              <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`group relative bg-white border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 shadow-lg max-w-3xl mx-auto ${
                    isDragging
                      ? 'border-slate-400 bg-slate-50 scale-[1.02] shadow-xl'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 hover:shadow-xl'
                  }`}
              >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] rounded-3xl pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className={`w-24 h-24 bg-slate-100 text-slate-700 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-sm border-2 border-slate-200 ${
                      isDragging ? 'scale-110 rotate-3 border-slate-300' : 'group-hover:scale-105 group-hover:border-slate-300'
                    }`}>
                       <Upload size={40} strokeWidth={2} />
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-2xl font-bold text-slate-900">
                         {isDragging ? 'Drop your image here!' : 'Drop your room photo here'}
                       </h3>
                       <p className="text-slate-600 font-medium">
                         {isDragging ? 'Release to upload' : 'or click to browse files'}
                       </p>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-100 px-4 py-2 rounded-full font-semibold border border-slate-200">Supports JPG, PNG • Max 10MB</span>
                  </div>
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                  />
              </div>
            </div>
        );
    }

    // ANALYZING
    if (redesignState === AppState.ANALYZING) {
        return (
            <div className="animate-fade-in max-w-2xl mx-auto text-center py-20 px-6">
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-slate-300 blur-2xl opacity-10 rounded-full"></div>
                    <img src={originalImage!} alt="Original" className="relative h-64 w-auto rounded-2xl shadow-2xl object-cover border-4 border-white" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-2xl">
                        <div className="bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-lg flex flex-col items-center gap-3 border border-slate-100">
                           <Loader2 className="animate-spin text-slate-700 h-10 w-10" strokeWidth={2.5} />
                           <span className="font-bold text-slate-900 text-sm">Scanning Room...</span>
                        </div>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Analyzing Architecture</h2>
                <p className="text-slate-500 mb-8 font-medium">Identifying {roomContext.toLowerCase()} layout features...</p>
                <div className="max-w-md mx-auto">
                  <ProgressBar
                    isLoading={true}
                    estimatedDuration={8000}
                    label="Processing image"
                  />
                </div>
            </div>
        );
    }

    // SELECTION / DASHBOARD
    if (redesignState === AppState.SELECTION || (redesignState === AppState.GENERATING && !generatedRedesign)) {
        return (
            <div className="animate-slide-up max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Column: Image & Analysis */}
                <div className="w-full lg:w-[380px] space-y-6 sticky top-24 shrink-0">
                    <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 ring-1 ring-slate-900/5">
                        <img src={originalImage!} alt="Original" className="w-full h-auto rounded-2xl object-cover" />
                        <button onClick={resetRedesign} className="w-full mt-4 py-2 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-wider">
                           Upload Different Photo
                        </button>
                    </div>
                    {analysis ? <AnalysisPanel analysis={analysis} /> : <AnalysisSkeleton />}
                </div>

                {/* Right Column: Controls */}
                <div className="w-full flex-grow space-y-6">

                    {/* Header */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                       <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                          <div className="bg-slate-900 p-3 rounded-xl text-white shadow-sm"><Wand2 size={22} /></div>
                          Choose Your Transformation
                       </h2>
                       <p className="text-slate-600 mt-2 pl-[52px]">Context: <span className="font-bold text-slate-900">{roomContext}</span>. Select a style below.</p>
                    </div>

                    {/* AI Recommendations */}
                    {analysis && analysis.suggestedPrompts.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider px-2">
                           <Sparkles size={16} className="text-slate-700" /> AI Recommended for this Space
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {analysis.suggestedPrompts.map((prompt, idx) => (
                            <button
                              key={`suggested-${idx}`}
                              onClick={() => setSelectedStyleId(`suggested-${idx}`)}
                              className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg
                                ${selectedStyleId === `suggested-${idx}`
                                  ? 'border-slate-900 bg-slate-50 shadow-md'
                                  : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
                                }`}
                            >
                              <h3 className="font-bold text-slate-900 mb-2">{prompt.title}</h3>
                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{prompt.description}</p>
                              {selectedStyleId === `suggested-${idx}` && (
                                <div className="absolute top-4 right-4 text-slate-900"><CheckCircleIcon size={20} /></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Standard Styles */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                           <Palette size={16} /> Classic Presets
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                            {DESIGN_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyleId(style.id)}
                                    className={`relative group overflow-hidden rounded-2xl text-left border-2 transition-all duration-300 ${selectedStyleId === style.id ? 'border-indigo-600 ring-2 ring-indigo-100 transform scale-[1.02]' : 'border-transparent shadow-sm hover:shadow-md hover:border-slate-200'}`}
                                >
                                    <div className={`h-28 bg-gradient-to-br ${style.previewGradient} p-5 flex flex-col justify-between relative`}>
                                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${style.textColor}`}>
                                           <Palette size={64} />
                                        </div>
                                        <span className={`font-bold text-lg ${style.textColor} z-10`}>{style.name}</span>
                                        {selectedStyleId === style.id && <div className="bg-white/30 backdrop-blur-md w-fit px-2 py-1 rounded-lg text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm"><Check size={12} /> Active</div>}
                                    </div>
                                    <div className="p-4 bg-white">
                                        <p className="text-xs font-medium text-slate-500">{style.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="relative mb-8">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">OR Custom</span>
                            </div>
                        </div>

                        <div className={`p-1 rounded-2xl border-2 transition-all duration-300 ${selectedStyleId === 'custom' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                            <div
                                className="flex items-start gap-4 p-4 cursor-pointer"
                                onClick={() => setSelectedStyleId('custom')}
                            >
                                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedStyleId === 'custom' ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                                    {selectedStyleId === 'custom' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <div className="w-full">
                                    <span className="font-bold text-slate-900 block mb-2">Custom Prompt</span>
                                    <textarea
                                        placeholder={`E.g. 'A ${roomContext === 'Commercial' ? 'minimalist startup office' : 'bohemian living room'} with...'`}
                                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm min-h-[100px] bg-white transition-all shadow-sm"
                                        value={customPrompt}
                                        onFocus={() => setSelectedStyleId('custom')}
                                        onChange={(e) => {
                                            setCustomPrompt(e.target.value);
                                            setSelectedStyleId('custom');
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end items-center gap-6">
                             {selectedStyleId && (
                                <span className="text-sm font-medium text-slate-500 animate-fade-in">
                                   Ready to transform?
                                </span>
                             )}
                            <button
                                onClick={handleRedesign}
                                disabled={redesignState === AppState.GENERATING || !selectedStyleId}
                                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95
                                    ${redesignState === AppState.GENERATING || !selectedStyleId
                                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                        : 'bg-slate-900 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5'}`}
                            >
                                {redesignState === AppState.GENERATING ? (
                                    <><Loader2 className="animate-spin" size={20} /> Generating Design...</>
                                ) : (
                                    <><Wand2 size={20} /> Generate Transformation</>
                                )}
                            </button>
                        </div>

                        {redesignState === AppState.GENERATING && (
                          <div className="mt-6">
                            <ProgressBar
                              isLoading={true}
                              estimatedDuration={12000}
                              label="Generating transformation"
                            />
                          </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // COMPLETE OR RE-GENERATING FROM CHAT
    if ((redesignState === AppState.COMPLETE || (redesignState === AppState.GENERATING && generatedRedesign)) && originalImage) {
        return (
            <div className="animate-fade-in max-w-7xl mx-auto px-6 space-y-8 py-4 relative">

                {/* Chat Overlay */}
                <DesignerChat
                   isOpen={isChatOpen}
                   onClose={() => setIsChatOpen(false)}
                   currentImageBase64={generatedRedesign ? extractBase64(generatedRedesign) : originalImageBase64!}
                   originalImageBase64={originalImageBase64!}
                   analysis={analysis}
                   roomContext={roomContext}
                   onTriggerRedesign={handleChatTriggeredRedesign}
                   messages={chatMessages}
                   setMessages={setChatMessages}
                />

                {/* Floating Chat Button (Bottom Left) */}
                {!isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="fixed bottom-6 left-6 z-40 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-3 font-bold border border-slate-700"
                    >
                        <MessageCircle size={22} />
                        <span>Talk to Designer</span>
                    </button>
                )}

                <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3 border border-emerald-100">
                            <Check size={14} strokeWidth={3} /> Design Complete
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">Your Dream Space</h2>
                        <p className="text-slate-600 mt-2">Drag the slider to reveal the transformation.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setGeneratedRedesign(null);
                                setRedesignState(AppState.SELECTION);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-bold shadow-sm"
                        >
                            <RefreshCcw size={18} /> Try Another Style
                        </button>
                        <a
                            href={generatedRedesign!}
                            download="lumina-redesign.png"
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all font-bold"
                        >
                            <Download size={18} /> Download HD
                        </a>
                    </div>
                </div>

                <div className="relative bg-white p-3 rounded-[2rem] shadow-2xl shadow-slate-300/50 border border-white ring-1 ring-slate-200">
                   {/* Loading Overlay for Chat-triggered updates */}
                   {redesignState === AppState.GENERATING && (
                      <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center">
                          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                             <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
                             <div className="text-center">
                                <h3 className="font-bold text-slate-900">Refining Design...</h3>
                                <p className="text-sm text-slate-500">Applying your feedback</p>
                             </div>
                             <div className="w-64">
                               <ProgressBar
                                 isLoading={true}
                                 estimatedDuration={12000}
                                 label="Processing"
                               />
                             </div>
                          </div>
                      </div>
                   )}
                   <BeforeAfterSlider beforeImage={originalImage} afterImage={generatedRedesign!} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                       <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Sparkles size={18} className="text-slate-700"/> Style Applied</h3>
                       <p className="text-slate-600 leading-relaxed font-medium">
                          {selectedStyleId === 'custom'
                             ? `Custom: "${customPrompt}"`
                             : selectedStyleId?.startsWith('suggested-')
                                ? analysis?.suggestedPrompts[parseInt(selectedStyleId.split('-')[1])].title
                                : DESIGN_STYLES.find(s => s.id === selectedStyleId)?.name || "Refined Design"}
                       </p>
                   </div>
                   <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
                        onClick={resetRedesign}
                   >
                       <div>
                           <h3 className="font-bold text-slate-900 mb-1">Start New Project</h3>
                           <p className="text-slate-600 text-sm">Upload a different room photo</p>
                       </div>
                       <div className="bg-white p-3 rounded-full shadow-sm text-slate-700 group-hover:scale-105 group-hover:shadow-md transition-all border border-slate-200">
                           <ArrowRight size={22} />
                       </div>
                   </div>
                </div>
            </div>
        );
    }

    return null;
  };

  // CheckCircle Helper
  const CheckCircleIcon = ({ size }: { size: number }) => (
    <div className={`bg-indigo-600 rounded-full p-0.5 text-white flex items-center justify-center`} style={{ width: size, height: size }}>
        <Check size={size - 4} strokeWidth={4} />
    </div>
  );

  const renderGenerateFlow = () => (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
        <div className="text-center mb-12">
           <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
              <ImagePlus size={32} />
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Text to Reality</h1>
           <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">Generate completely new interior concepts from scratch using Imagen 4.0. No existing photo required.</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden ring-1 ring-slate-900/5">
            <div className="p-8 md:p-10">
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Describe your imagination</label>
                <div className="relative">
                    <textarea
                        className="w-full p-6 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none text-lg transition-all resize-none min-h-[160px] shadow-inner"
                        placeholder="e.g. 'A futuristic bedroom with a glass ceiling looking out into deep space, neon blue accent lighting, sleek white furniture, hyper-realistic 8k render'"
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                    />
                    <div className="absolute bottom-4 right-4 text-slate-400 text-xs font-medium bg-white/80 px-2 py-1 rounded-md backdrop-blur">
                        Powered by Imagen 4.0
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                    onClick={handleGenerateNew}
                    disabled={generateState === AppState.GENERATING}
                    className={`px-10 py-4 rounded-xl font-bold text-white shadow-lg flex items-center gap-3 transition-all transform active:scale-95
                        ${generateState === AppState.GENERATING ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5'}`}
                    >
                    {generateState === AppState.GENERATING ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    Generate Concept
                    </button>
                </div>

                {generateState === AppState.GENERATING && (
                  <div className="mt-6">
                    <ProgressBar
                      isLoading={true}
                      estimatedDuration={15000}
                      label="Creating your masterpiece"
                    />
                  </div>
                )}
            </div>

            {(generatedNewImage || generateState === AppState.GENERATING) && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-8 md:p-12 flex flex-col items-center min-h-[500px] justify-center">
                    {generateState === AppState.GENERATING ? (
                        <div className="text-center">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-slate-300 opacity-20 rounded-full animate-ping"></div>
                                <div className="relative bg-white p-4 rounded-full shadow-lg text-slate-700 border border-slate-200">
                                    <Loader2 className="w-12 h-12 animate-spin" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Creating your masterpiece</h3>
                            <p className="text-slate-600 font-medium mt-2">This usually takes about 10-15 seconds...</p>
                        </div>
                    ) : generatedNewImage ? (
                        <div className="w-full space-y-6 animate-scale-in max-w-3xl mx-auto">
                             <div className="p-2 bg-white rounded-2xl shadow-xl border border-slate-100">
                                 <img src={generatedNewImage} alt="Generated" className="w-full rounded-xl" />
                             </div>
                             <div className="flex justify-center gap-4">
                                 <a
                                    href={generatedNewImage}
                                    download="lumina-generated.jpg"
                                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 font-bold shadow-lg hover:shadow-xl transition-all"
                                 >
                                     <Download size={18} /> Download Image
                                 </a>
                                 <button
                                    onClick={() => setGeneratedNewImage(null)}
                                    className="flex items-center gap-2 bg-white border-2 border-slate-200 px-6 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-bold shadow-sm transition-all"
                                 >
                                     Generate Another
                                 </button>
                             </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />

      {/* Context Modal */}
      <ContextSelectionModal />

      {/* Navbar */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetRedesign}>
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
              <Wand2 size={22} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">Lumina</span>
          </div>

          <nav className="flex items-center gap-4">
             <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
               <button
                  onClick={() => setActiveTab(Tab.REDESIGN)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === Tab.REDESIGN ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Redesign Room
                </button>
                <button
                  onClick={() => setActiveTab(Tab.GENERATE)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === Tab.GENERATE ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Create New
                </button>
             </div>

             <button
               onClick={() => setShowKeyboardShortcuts(true)}
               className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
               title="Keyboard shortcuts (Cmd/Ctrl + K)"
             >
               <Keyboard size={20} />
             </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-8 pb-20">
        {activeTab === Tab.REDESIGN && redesignState !== AppState.IDLE && redesignState !== AppState.COMPLETE && <StepIndicator />}

        <div style={{ display: activeTab === Tab.REDESIGN ? 'block' : 'none' }}>
           {renderRedesignFlow()}
        </div>
        <div style={{ display: activeTab === Tab.GENERATE ? 'block' : 'none' }}>
           {renderGenerateFlow()}
        </div>
      </main>

      <footer className="py-10 border-t border-slate-200/60 bg-white/40">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                 <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                     <Wand2 size={12} />
                 </div>
                 <p className="text-slate-500 text-sm font-semibold">Lumina Interiors AI</p>
             </div>
             <div className="flex items-center gap-4 text-slate-500 text-sm font-medium bg-white/50 px-4 py-2 rounded-full border border-slate-200">
                <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-slate-600"/> Gemini 2.5 Flash</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="flex items-center gap-1.5"><ImagePlus size={12} className="text-slate-600"/> Imagen 4.0</span>
             </div>
         </div>
      </footer>
    </div>
  );
};

export default App;
