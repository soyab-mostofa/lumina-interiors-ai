"use client";

import React, { useState, useRef } from "react";
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
  Stars,
  MessageCircle,
  CheckCircle,
  Home,
  Building2,
} from "lucide-react";
import {
  AppState,
  DESIGN_STYLES,
  type RoomAnalysis,
  type ChatMessage,
} from "~/types";
import { fileToBase64, compressBase64 } from "~/lib/utils";
import { BeforeAfterSlider } from "~/components/BeforeAfterSlider";
import { AnalysisPanel } from "~/components/AnalysisPanel";
import { DesignerChat } from "~/components/DesignerChat";
import { api } from "~/lib/trpc/client";

enum Tab {
  REDESIGN = "redesign",
  GENERATE = "generate",
}

const STEPS = [
  { number: 1, title: "Upload" },
  { number: 2, title: "Analyze" },
  { number: 3, title: "Style" },
  { number: 4, title: "Result" },
];

type RoomContextType = "Residential" | "Commercial";

export default function HomePage() {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState<Tab>(Tab.REDESIGN);
  const [error, setError] = useState<string | null>(null);

  // --- Redesign Tab State ---
  const [redesignState, setRedesignState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(
    null
  );
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedRedesign, setGeneratedRedesign] = useState<string | null>(
    null
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // --- Upload & Context Flow State ---
  const [showContextModal, setShowContextModal] = useState(false);
  const [tempUploadedFile, setTempUploadedFile] = useState<File | null>(null);
  const [roomContext, setRoomContext] =
    useState<RoomContextType>("Residential");

  // --- Generate New Tab State ---
  const [generateState, setGenerateState] = useState<AppState>(AppState.IDLE);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generatedNewImage, setGeneratedNewImage] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- tRPC Mutations ---
  const analyzeMutation = api.roomAnalysis.analyze.useMutation();
  const redesignMutation = api.roomAnalysis.redesign.useMutation();
  const generateMutation = api.imageGeneration.createNew.useMutation();

  // --- Computed Step ---
  const getCurrentRedesignStep = () => {
    if (redesignState === AppState.IDLE && !originalImage) return 1;
    if (redesignState === AppState.ANALYZING) return 2;
    if (
      redesignState === AppState.SELECTION ||
      (redesignState === AppState.GENERATING && !generatedRedesign)
    )
      return 3;
    if (redesignState === AppState.COMPLETE) return 4;
    return 1;
  };

  // --- Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setTempUploadedFile(file);
    setShowContextModal(true);
    e.target.value = "";
  };

  const handleContextSelection = async (context: RoomContextType) => {
    if (!tempUploadedFile) return;

    setRoomContext(context);
    setShowContextModal(false);

    setRedesignState(AppState.ANALYZING);
    setOriginalImage(URL.createObjectURL(tempUploadedFile));
    setAnalysis(null);
    setGeneratedRedesign(null);
    setSelectedStyleId(null);
    setChatMessages([]);
    setActiveTab(Tab.REDESIGN);

    try {
      const base64 = await fileToBase64(tempUploadedFile);
      setOriginalImageBase64(base64);

      const result = await analyzeMutation.mutateAsync({
        base64Image: base64,
        contextHint: context,
      });

      setAnalysis(result);
      setRedesignState(AppState.SELECTION);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze image. Please try a smaller image."
      );
      setRedesignState(AppState.IDLE);
    } finally {
      setTempUploadedFile(null);
    }
  };

  const handleRedesign = async () => {
    if (!originalImageBase64) return;

    let finalPrompt = "";

    if (selectedStyleId?.startsWith("suggested-")) {
      const index = parseInt(selectedStyleId.split("-")[1]!);
      if (analysis?.suggestedPrompts[index]) {
        finalPrompt = analysis.suggestedPrompts[index]!.prompt;
      }
    } else if (selectedStyleId === "custom") {
      if (!customPrompt.trim()) {
        setError("Please enter a custom prompt.");
        return;
      }
      finalPrompt = customPrompt;
    } else if (selectedStyleId) {
      const style = DESIGN_STYLES.find((s) => s.id === selectedStyleId);
      if (style) finalPrompt = style.promptSuffix;
    } else {
      setError("Please select a style.");
      return;
    }

    setRedesignState(AppState.GENERATING);
    setError(null);

    try {
      const result = await redesignMutation.mutateAsync({
        base64Original: originalImageBase64,
        promptDescription: finalPrompt,
        styleId: selectedStyleId,
      });

      setGeneratedRedesign(result.resultImage);
      setRedesignState(AppState.COMPLETE);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate redesign. Try a simpler request."
      );
      setRedesignState(AppState.SELECTION);
    }
  };

  const handleChatTriggeredRedesign = async (prompt: string) => {
    if (!originalImageBase64) return;

    setRedesignState(AppState.GENERATING);

    try {
      const result = await redesignMutation.mutateAsync({
        base64Original: originalImageBase64,
        promptDescription: prompt,
      });

      setGeneratedRedesign(result.resultImage);
      setRedesignState(AppState.COMPLETE);
    } catch {
      setError("Failed to update design from chat.");
      setRedesignState(AppState.COMPLETE);
    }
  };

  const handleGenerateNew = async () => {
    if (!generatePrompt.trim()) {
      setError("Please describe the image you want to generate.");
      return;
    }

    setGenerateState(AppState.GENERATING);
    setError(null);

    try {
      const result = await generateMutation.mutateAsync({
        prompt: generatePrompt,
      });

      setGeneratedNewImage(result.resultImage);
      setGenerateState(AppState.COMPLETE);
    } catch {
      setError("Failed to generate image. Please try again.");
      setGenerateState(AppState.IDLE);
    }
  };

  const resetRedesign = () => {
    setRedesignState(AppState.IDLE);
    setOriginalImage(null);
    setOriginalImageBase64(null);
    setAnalysis(null);
    setGeneratedRedesign(null);
    setSelectedStyleId(null);
    setCustomPrompt("");
    setError(null);
    setChatMessages([]);
    setIsChatOpen(false);
    setTempUploadedFile(null);
  };

  // --- Components ---
  const ContextSelectionModal = () => {
    if (!showContextModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowContextModal(false)}
        ></div>
        <div className="animate-scale-in relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">
              What kind of space is this?
            </h2>
            <p className="mt-2 text-slate-500">
              Helping us understand the context improves our suggestions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <button
              onClick={() => handleContextSelection("Residential")}
              className="group relative rounded-2xl border-2 border-slate-200 bg-slate-50 p-8 text-left transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm transition-all group-hover:scale-110 group-hover:text-indigo-600">
                <Home size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Residential
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Living rooms, bedrooms, kitchens, apartments, and personal
                spaces.
              </p>
              <div className="absolute right-6 top-6 text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                <CheckCircle size={24} />
              </div>
            </button>

            <button
              onClick={() => handleContextSelection("Commercial")}
              className="group relative rounded-2xl border-2 border-slate-200 bg-slate-50 p-8 text-left transition-all duration-300 hover:border-purple-500 hover:bg-purple-50"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm transition-all group-hover:scale-110 group-hover:text-purple-600">
                <Building2 size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Commercial
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Offices, retail stores, lobbies, co-working spaces, and business
                environments.
              </p>
              <div className="absolute right-6 top-6 text-purple-600 opacity-0 transition-opacity group-hover:opacity-100">
                <CheckCircle size={24} />
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
      <div className="animate-fade-in mb-12 flex justify-center">
        <div className="flex items-center space-x-2 rounded-full border border-white/50 bg-white/50 px-6 py-3 shadow-sm backdrop-blur-md md:space-x-6">
          {STEPS.map((step) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300
                ${currentStep >= step.number ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "border-slate-300 bg-white text-slate-400"}
              `}
              >
                {currentStep > step.number ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`ml-2 hidden text-sm font-semibold md:block ${currentStep >= step.number ? "text-indigo-900" : "text-slate-400"}`}
              >
                {step.title}
              </span>
              {step.number < 4 && (
                <div
                  className={`ml-2 h-0.5 w-6 transition-colors duration-300 md:ml-6 md:w-10 ${currentStep > step.number ? "bg-indigo-200" : "bg-slate-200"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRedesignFlow = () => {
    // IDLE / UPLOAD
    if (
      redesignState === AppState.IDLE ||
      (redesignState === AppState.ANALYZING && !originalImage)
    ) {
      return (
        <div className="animate-slide-up mx-auto max-w-5xl px-6 py-10">
          <div className="mb-16 space-y-6 text-center">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-bold text-indigo-600">
              <Stars size={16} />
              <span>AI-Powered Interior Designer</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-7xl">
              Redesign your space <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                in seconds.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-slate-600 md:text-xl">
              Upload a photo and let our AI analyze your room, suggest tailored
              improvements, and visualize your dream interior instantly.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative mx-auto max-w-3xl cursor-pointer rounded-[2rem] border-2 border-dashed border-slate-300 bg-white p-16 text-center shadow-2xl shadow-slate-200/50 transition-all duration-300 hover:border-indigo-500 hover:bg-slate-50/50"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-sm transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
                <Upload size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">
                  Drop your room photo here
                </h3>
                <p className="font-medium text-slate-500">
                  or click to browse files
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-400">
                Supports JPG, PNG • Max 10MB
              </span>
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
        <div className="animate-fade-in mx-auto max-w-2xl py-20 text-center">
          <div className="relative inline-block">
            <div className="animate-pulse-slow absolute inset-0 rounded-full bg-indigo-500 opacity-20 blur-2xl"></div>
            <img
              src={originalImage!}
              alt="Original"
              className="relative h-64 w-auto rounded-2xl object-cover shadow-2xl ring-4 ring-white"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/10 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-xl">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">
                  Scanning Room...
                </span>
              </div>
            </div>
          </div>
          <h2 className="mt-10 text-2xl font-bold text-slate-900">
            Analyzing Architecture
          </h2>
          <p className="mt-2 font-medium text-slate-500">
            Identifying {roomContext.toLowerCase()} layout features...
          </p>
        </div>
      );
    }

    // SELECTION
    if (
      redesignState === AppState.SELECTION ||
      (redesignState === AppState.GENERATING && !generatedRedesign)
    ) {
      return (
        <div className="animate-slide-up mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 lg:flex-row">
          {/* Left Column */}
          <div className="sticky top-24 w-full shrink-0 space-y-6 lg:w-[380px]">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-lg ring-1 ring-slate-900/5">
              <img
                src={originalImage!}
                alt="Original"
                className="h-auto w-full rounded-2xl object-cover"
              />
              <button
                onClick={resetRedesign}
                className="mt-4 w-full rounded-lg py-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                Upload Different Photo
              </button>
            </div>
            {analysis && <AnalysisPanel analysis={analysis} />}
          </div>

          {/* Right Column */}
          <div className="w-full flex-grow space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                  <Wand2 size={24} />
                </div>
                Choose Your Transformation
              </h2>
              <p className="mt-2 pl-12 text-slate-500">
                Context:{" "}
                <span className="font-bold text-indigo-600">{roomContext}</span>
                . Select a style below.
              </p>
            </div>

            {/* AI Recommendations */}
            {analysis && analysis.suggestedPrompts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2 text-sm font-bold uppercase tracking-wider text-indigo-900">
                  <Sparkles size={16} className="text-indigo-500" /> AI
                  Recommended for this Space
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {analysis.suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={`suggested-${idx}`}
                      onClick={() => setSelectedStyleId(`suggested-${idx}`)}
                      className={`relative rounded-2xl border-2 p-6 text-left transition-all duration-300 hover:shadow-xl
                        ${selectedStyleId === `suggested-${idx}` ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100" : "border-white bg-white shadow-sm hover:border-indigo-200"}`}
                    >
                      <h3 className="mb-2 font-bold text-slate-900">
                        {prompt.title}
                      </h3>
                      <p className="line-clamp-3 text-xs leading-relaxed text-slate-500">
                        {prompt.description}
                      </p>
                      {selectedStyleId === `suggested-${idx}` && (
                        <div className="absolute right-4 top-4 text-indigo-600">
                          <CheckCircle size={20} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Styles */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                <Palette size={16} /> Classic Presets
              </h3>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {DESIGN_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${selectedStyleId === style.id ? "scale-[1.02] transform border-indigo-600 ring-2 ring-indigo-100" : "border-transparent shadow-sm hover:border-slate-200 hover:shadow-md"}`}
                  >
                    <div
                      className={`flex h-28 flex-col justify-between bg-gradient-to-br p-5 ${style.previewGradient} relative`}
                    >
                      <div
                        className={`absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 ${style.textColor}`}
                      >
                        <Palette size={64} />
                      </div>
                      <span className={`z-10 text-lg font-bold ${style.textColor}`}>
                        {style.name}
                      </span>
                      {selectedStyleId === style.id && (
                        <div className="flex w-fit items-center gap-1 rounded-lg bg-white/30 px-2 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur-md">
                          <Check size={12} /> Active
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-4">
                      <p className="text-xs font-medium text-slate-500">
                        {style.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                    OR Custom
                  </span>
                </div>
              </div>

              <div
                className={`rounded-2xl border-2 p-1 transition-all duration-300 ${selectedStyleId === "custom" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100 bg-slate-50 hover:border-slate-300"}`}
              >
                <div
                  className="flex cursor-pointer items-start gap-4 p-4"
                  onClick={() => setSelectedStyleId("custom")}
                >
                  <div
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selectedStyleId === "custom" ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"}`}
                  >
                    {selectedStyleId === "custom" && (
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="w-full">
                    <span className="mb-2 block font-bold text-slate-900">
                      Custom Prompt
                    </span>
                    <textarea
                      placeholder={`E.g. 'A ${roomContext === "Commercial" ? "minimalist startup office" : "bohemian living room"} with...'`}
                      className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                      value={customPrompt}
                      onFocus={() => setSelectedStyleId("custom")}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value);
                        setSelectedStyleId("custom");
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-6">
                {selectedStyleId && (
                  <span className="animate-fade-in text-sm font-medium text-slate-500">
                    Ready to transform?
                  </span>
                )}
                <button
                  onClick={handleRedesign}
                  disabled={
                    redesignState === AppState.GENERATING || !selectedStyleId
                  }
                  className={`flex transform items-center gap-3 rounded-xl px-8 py-4 font-bold text-white shadow-xl transition-all active:scale-95
                    ${redesignState === AppState.GENERATING || !selectedStyleId ? "cursor-not-allowed bg-slate-300 shadow-none" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:-translate-y-1 hover:shadow-indigo-500/30"}`}
                >
                  {redesignState === AppState.GENERATING ? (
                    <>
                      <Loader2 className="animate-spin" /> Generating Design...
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} /> Generate Transformation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPLETE
    if (
      (redesignState === AppState.COMPLETE ||
        (redesignState === AppState.GENERATING && generatedRedesign)) &&
      originalImage
    ) {
      return (
        <div className="animate-fade-in relative mx-auto max-w-7xl space-y-8 px-6 py-4">
          {/* Chat Overlay */}
          <DesignerChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            currentImageBase64={
              generatedRedesign
                ? generatedRedesign.split(",")[1]!
                : originalImageBase64!
            }
            originalImageBase64={originalImageBase64!}
            analysis={analysis}
            roomContext={roomContext}
            onTriggerRedesign={handleChatTriggeredRedesign}
            messages={chatMessages}
            setMessages={setChatMessages}
          />

          {/* Floating Chat Button */}
          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="animate-bounce fixed bottom-6 left-6 z-40 flex items-center gap-3 rounded-full border-2 border-white/10 bg-slate-900 px-6 py-4 font-bold text-white shadow-2xl transition-all hover:scale-105"
            >
              <MessageCircle size={24} className="text-indigo-400" />
              <span>Talk to Designer</span>
            </button>
          )}

          <div className="flex flex-col items-end justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:flex-row">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <Check size={12} strokeWidth={3} /> Design Complete
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Your Dream Space
              </h2>
              <p className="mt-2 font-medium text-slate-500">
                Drag the slider to reveal the transformation.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setGeneratedRedesign(null);
                  setRedesignState(AppState.SELECTION);
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <RefreshCcw size={18} /> Try Another Style
              </button>
              <a
                href={generatedRedesign!}
                download="lumina-redesign.png"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl"
              >
                <Download size={18} /> Download HD
              </a>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-slate-300/50 ring-1 ring-slate-200">
            {/* Loading Overlay */}
            {redesignState === AppState.GENERATING && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[2rem] bg-white/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-xl">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900">
                      Refining Design...
                    </h3>
                    <p className="text-sm text-slate-500">
                      Applying your feedback
                    </p>
                  </div>
                </div>
              </div>
            )}
            <BeforeAfterSlider
              beforeImage={originalImage}
              afterImage={generatedRedesign!}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                <Sparkles size={18} className="text-indigo-500" /> Style
                Applied
              </h3>
              <p className="leading-relaxed text-slate-600">
                {selectedStyleId === "custom"
                  ? `Custom: "${customPrompt}"`
                  : selectedStyleId?.startsWith("suggested-")
                    ? analysis?.suggestedPrompts[
                        parseInt(selectedStyleId.split("-")[1]!)
                      ]?.title
                    : DESIGN_STYLES.find((s) => s.id === selectedStyleId)
                        ?.name ?? "Refined Design"}
              </p>
            </div>
            <div
              className="group flex cursor-pointer items-center justify-between rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-8 shadow-sm transition-colors hover:border-indigo-200"
              onClick={resetRedesign}
            >
              <div>
                <h3 className="mb-1 font-bold text-indigo-900">
                  Start New Project
                </h3>
                <p className="text-sm text-indigo-600/70">
                  Upload a different room photo
                </p>
              </div>
              <div className="rounded-full bg-white p-3 text-indigo-600 shadow-md transition-transform group-hover:scale-110">
                <ArrowRight size={24} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderGenerateFlow = () => (
    <div className="animate-fade-in mx-auto max-w-4xl px-6 py-12">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 shadow-lg shadow-purple-100">
          <ImagePlus size={32} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Text to Reality
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
          Generate completely new interior concepts from scratch using Imagen
          4.0. No existing photo required.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5">
        <div className="p-8 md:p-10">
          <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-slate-700">
            Describe your imagination
          </label>
          <div className="relative">
            <textarea
              className="min-h-[160px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-6 text-lg shadow-inner outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
              placeholder="e.g. 'A futuristic bedroom with a glass ceiling looking out into deep space, neon blue accent lighting, sleek white furniture, hyper-realistic 8k render'"
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-slate-400 backdrop-blur">
              Powered by Imagen 4.0
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleGenerateNew}
              disabled={generateState === AppState.GENERATING}
              className={`flex transform items-center gap-3 rounded-xl px-10 py-4 font-bold text-white shadow-xl shadow-purple-200 transition-all hover:-translate-y-1
                ${generateState === AppState.GENERATING ? "cursor-not-allowed bg-slate-400" : "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-300"}`}
            >
              {generateState === AppState.GENERATING ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              Generate Concept
            </button>
          </div>
        </div>

        {(generatedNewImage || generateState === AppState.GENERATING) && (
          <div className="flex min-h-[500px] flex-col items-center justify-center border-t border-slate-100 bg-slate-50/50 p-8 md:p-12">
            {generateState === AppState.GENERATING ? (
              <div className="text-center">
                <div className="relative mx-auto mb-6 h-20 w-20">
                  <div className="animate-ping absolute inset-0 rounded-full bg-purple-500 opacity-20"></div>
                  <div className="relative rounded-full bg-white p-4 text-purple-600 shadow-lg">
                    <Loader2 className="h-12 w-12 animate-spin" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Creating your masterpiece
                </h3>
                <p className="mt-2 font-medium text-slate-500">
                  This usually takes about 10-15 seconds...
                </p>
              </div>
            ) : generatedNewImage ? (
              <div className="animate-scale-in mx-auto w-full max-w-3xl space-y-6">
                <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                  <img
                    src={generatedNewImage}
                    alt="Generated"
                    className="w-full rounded-xl"
                  />
                </div>
                <div className="flex justify-center gap-4">
                  <a
                    href={generatedNewImage}
                    download="lumina-generated.jpg"
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-purple-200"
                  >
                    <Download size={18} /> Download Image
                  </a>
                  <button
                    onClick={() => setGeneratedNewImage(null)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50"
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
    <div className="flex min-h-screen flex-col text-slate-900">
      <ContextSelectionModal />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div
            className="group flex cursor-pointer items-center gap-3"
            onClick={resetRedesign}
          >
            <div className="rounded-xl bg-slate-900 p-2.5 text-white shadow-lg shadow-slate-200 transition-transform group-hover:scale-105">
              <Wand2 size={22} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">
              Lumina
            </span>
          </div>

          <nav className="flex rounded-2xl border border-slate-200/50 bg-slate-100/80 p-1.5">
            <button
              onClick={() => setActiveTab(Tab.REDESIGN)}
              className={`rounded-xl px-6 py-2 text-sm font-bold transition-all duration-300 ${activeTab === Tab.REDESIGN ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-900"}`}
            >
              Redesign Room
            </button>
            <button
              onClick={() => setActiveTab(Tab.GENERATE)}
              className={`rounded-xl px-6 py-2 text-sm font-bold transition-all duration-300 ${activeTab === Tab.GENERATE ? "bg-white text-purple-600 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-900"}`}
            >
              Create New
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pb-20 pt-8">
        {activeTab === Tab.REDESIGN &&
          redesignState !== AppState.IDLE &&
          redesignState !== AppState.COMPLETE && <StepIndicator />}

        {error && (
          <div className="animate-fade-in mx-auto mb-8 flex max-w-lg items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-red-600 shadow-sm">
            <div className="mt-0.5 rounded-full bg-red-100 p-1">
              <ArrowRight className="rotate-180" size={14} />
            </div>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div style={{ display: activeTab === Tab.REDESIGN ? "block" : "none" }}>
          {renderRedesignFlow()}
        </div>
        <div style={{ display: activeTab === Tab.GENERATE ? "block" : "none" }}>
          {renderGenerateFlow()}
        </div>
      </main>

      <footer className="border-t border-slate-200/60 bg-white/40 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <Wand2 size={12} />
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Lumina Interiors AI
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-full border border-slate-100 bg-white/50 px-4 py-2 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-500" /> Gemini 2.5
              Flash
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1.5">
              <ImagePlus size={12} className="text-purple-500" /> Imagen 4.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
