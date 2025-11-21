"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Grid,
  Paper,
  Stack,
  TextField,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  useTheme,
  alpha,
  Fab,
  InputAdornment,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  AutoFixHigh as WandIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  AddPhotoAlternate as ImagePlusIcon,
  Palette as PaletteIcon,
  ArrowForward as ArrowRightIcon,
  Check as CheckIcon,
  AutoAwesome as SparklesIcon,
  Stars as StarsIcon,
  Chat as ChatIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import {
  AppState,
  DESIGN_STYLES,
  type RoomAnalysis,
  type ChatMessage,
} from "~/types";
import { fileToBase64 } from "~/lib/utils";
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
  const theme = useTheme();
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
  const ContextSelectionModal = () => (
    <Dialog
      open={showContextModal}
      onClose={() => setShowContextModal(false)}
      PaperProps={{
        sx: { borderRadius: 4, p: 2, maxWidth: 600 },
      }}
    >
      <DialogTitle align="center">
        <Typography variant="h5" fontWeight="bold">
          What kind of space is this?
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText align="center" sx={{ mb: 4 }}>
          Helping us understand the context improves our suggestions.
        </DialogContentText>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 4,
                height: "100%",
                borderColor: "divider",
                "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
              }}
            >
              <CardActionArea
                onClick={() => handleContextSelection("Residential")}
                sx={{ p: 3, height: "100%", textAlign: "left" }}
              >
                <Box
                  sx={{
                    mb: 2,
                    width: 64,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    color: "text.secondary",
                  }}
                >
                  <HomeIcon fontSize="large" />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Residential
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Living rooms, bedrooms, kitchens, apartments, and personal spaces.
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 4,
                height: "100%",
                borderColor: "divider",
                "&:hover": { borderColor: "secondary.main", bgcolor: "secondary.50" },
              }}
            >
              <CardActionArea
                onClick={() => handleContextSelection("Commercial")}
                sx={{ p: 3, height: "100%", textAlign: "left" }}
              >
                <Box
                  sx={{
                    mb: 2,
                    width: 64,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    color: "text.secondary",
                  }}
                >
                  <BusinessIcon fontSize="large" />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Commercial
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Offices, retail stores, lobbies, co-working spaces, and business environments.
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );

  const StepIndicator = () => {
    const currentStep = getCurrentRedesignStep();
    return (
      <Box sx={{ mb: 6, display: "flex", justifyContent: "center" }}>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, md: 3 },
            px: 3,
            py: 1.5,
            borderRadius: 50,
            border: 1,
            borderColor: "divider",
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: "blur(8px)",
          }}
        >
          {STEPS.map((step) => (
            <Box key={step.number} sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: 2,
                  borderColor: currentStep >= step.number ? "primary.main" : "divider",
                  bgcolor: currentStep >= step.number ? "primary.main" : "background.paper",
                  color: currentStep >= step.number ? "common.white" : "text.disabled",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  transition: "all 0.3s",
                }}
              >
                {currentStep > step.number ? <CheckIcon fontSize="small" /> : step.number}
              </Box>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  ml: 1,
                  display: { xs: "none", md: "block" },
                  color: currentStep >= step.number ? "text.primary" : "text.disabled",
                }}
              >
                {step.title}
              </Typography>
              {step.number < 4 && (
                <Box
                  sx={{
                    ml: { xs: 1, md: 3 },
                    width: { xs: 24, md: 40 },
                    height: 2,
                    bgcolor: currentStep > step.number ? "primary.light" : "divider",
                    transition: "all 0.3s",
                  }}
                />
              )}
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };

  const renderRedesignFlow = () => {
    // IDLE / UPLOAD
    if (
      redesignState === AppState.IDLE ||
      (redesignState === AppState.ANALYZING && !originalImage)
    ) {
      return (
        <Container maxWidth="lg" sx={{ py: 10, textAlign: "center" }}>
          <Box sx={{ mb: 8 }}>
            <Chip
              icon={<StarsIcon />}
              label="AI-Powered Interior Designer"
              color="primary"
              variant="outlined"
              sx={{ mb: 3, fontWeight: "bold", px: 1 }}
            />
            <Typography variant="h1" fontWeight={800} gutterBottom sx={{ fontSize: { xs: "3rem", md: "4.5rem" } }}>
              Redesign your space <br />
              <Box component="span" sx={{ color: "primary.main" }}>
                in seconds.
              </Box>
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 700, mx: "auto", mt: 3 }}>
              Upload a photo and let our AI analyze your room, suggest tailored improvements, and visualize your dream interior instantly.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              maxWidth: 800,
              mx: "auto",
              p: 8,
              borderRadius: 8,
              border: "2px dashed",
              borderColor: "divider",
              bgcolor: "background.paper",
              cursor: "pointer",
              transition: "all 0.3s",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <Stack spacing={3} alignItems="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 4,
                  bgcolor: "primary.50",
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UploadIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Drop your room photo here
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  or click to browse files
                </Typography>
              </Box>
              <Chip label="Supports JPG, PNG • Max 10MB" size="small" />
            </Stack>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
          </Paper>
        </Container>
      );
    }

    // ANALYZING
    if (redesignState === AppState.ANALYZING) {
      return (
        <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Box
              component="img"
              src={originalImage!}
              alt="Original"
              sx={{
                width: "100%",
                maxHeight: 400,
                objectFit: "cover",
                borderRadius: 4,
                boxShadow: theme.shadows[10],
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha("#000", 0.2),
                borderRadius: 4,
                backdropFilter: "blur(4px)",
              }}
            >
              <Paper
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  borderRadius: 3,
                }}
              >
                <CircularProgress size={40} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Scanning Room...
                </Typography>
              </Paper>
            </Box>
          </Box>
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 4 }}>
            Analyzing Architecture
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Identifying {roomContext.toLowerCase()} layout features...
          </Typography>
        </Container>
      );
    }

    // SELECTION
    if (
      redesignState === AppState.SELECTION ||
      (redesignState === AppState.GENERATING && !generatedRedesign)
    ) {
      return (
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6 } }}>
          <Grid container spacing={4}>
            {/* Left Column */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3} sx={{ position: "sticky", top: 24 }}>
                <Paper sx={{ p: 2, borderRadius: 4, overflow: "hidden" }}>
                  <Box
                    component="img"
                    src={originalImage!}
                    alt="Original"
                    sx={{
                      width: "100%",
                      borderRadius: 3,
                      objectFit: "cover",
                    }}
                  />
                  <Button
                    fullWidth
                    variant="text"
                    color="error"
                    onClick={resetRedesign}
                    sx={{ mt: 2 }}
                  >
                    Upload Different Photo
                  </Button>
                </Paper>
                {analysis && <AnalysisPanel analysis={analysis} />}
              </Stack>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.50", color: "primary.main" }}>
                    <WandIcon />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Choose Your Transformation
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                  Context: <Box component="span" fontWeight="bold" color="primary.main">{roomContext}</Box>. Select a style below.
                </Typography>
              </Paper>

              {/* AI Recommendations */}
              {analysis && analysis.suggestedPrompts.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <SparklesIcon fontSize="small" /> AI Recommended for this Space
                  </Typography>
                  <Grid container spacing={2}>
                    {analysis.suggestedPrompts.map((prompt, idx) => (
                      <Grid item xs={12} md={4} key={`suggested-${idx}`}>
                        <Card
                          variant="outlined"
                          sx={{
                            height: "100%",
                            borderRadius: 3,
                            borderColor: selectedStyleId === `suggested-${idx}` ? "primary.main" : "divider",
                            bgcolor: selectedStyleId === `suggested-${idx}` ? "primary.50" : "background.paper",
                            transition: "all 0.2s",
                          }}
                        >
                          <CardActionArea
                            onClick={() => setSelectedStyleId(`suggested-${idx}`)}
                            sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}
                          >
                            <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {prompt.title}
                              </Typography>
                              {selectedStyleId === `suggested-${idx}` && <CheckCircleIcon color="primary" fontSize="small" />}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {prompt.description}
                            </Typography>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Standard Styles */}
              <Paper sx={{ p: 4, borderRadius: 4 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1, textTransform: "uppercase" }}>
                  <PaletteIcon fontSize="small" /> Classic Presets
                </Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {DESIGN_STYLES.map((style) => (
                    <Grid item xs={12} sm={6} md={4} key={style.id}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          overflow: "hidden",
                          border: 2,
                          borderColor: selectedStyleId === style.id ? "primary.main" : "transparent",
                          transform: selectedStyleId === style.id ? "scale(1.02)" : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        <CardActionArea onClick={() => setSelectedStyleId(style.id)}>
                          <Box
                            sx={{
                              height: 120,
                              p: 2,
                              background: `linear-gradient(135deg, ${style.previewGradient.replace("from-", "").replace("to-", "").split(" ").map(c => c.replace("indigo-500", "#6366f1").replace("purple-500", "#a855f7").replace("pink-500", "#ec4899").replace("blue-500", "#3b82f6").replace("emerald-500", "#10b981").replace("orange-500", "#f97316").replace("slate-500", "#64748b")).join(", ")})`, // Simplified gradient mapping for demo
                              position: "relative",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="h6" fontWeight="bold" sx={{ color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                              {style.name}
                            </Typography>
                            {selectedStyleId === style.id && (
                              <Chip label="Active" size="small" color="default" sx={{ bgcolor: "white", fontWeight: "bold" }} />
                            )}
                          </Box>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {style.description}
                            </Typography>
                          </Box>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <DividerWithText text="OR Custom" />

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: selectedStyleId === "custom" ? "primary.main" : "divider",
                    bgcolor: selectedStyleId === "custom" ? "primary.50" : "background.paper",
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box
                        onClick={() => setSelectedStyleId("custom")}
                        sx={{
                          mt: 1,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: 2,
                          borderColor: selectedStyleId === "custom" ? "primary.main" : "divider",
                          bgcolor: selectedStyleId === "custom" ? "primary.main" : "background.paper",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selectedStyleId === "custom" && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "white" }} />}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom onClick={() => setSelectedStyleId("custom")} sx={{ cursor: "pointer" }}>
                          Custom Prompt
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          placeholder={`E.g. 'A ${roomContext === "Commercial" ? "minimalist startup office" : "bohemian living room"} with...'`}
                          value={customPrompt}
                          onFocus={() => setSelectedStyleId("custom")}
                          onChange={(e) => {
                            setCustomPrompt(e.target.value);
                            setSelectedStyleId("custom");
                          }}
                          sx={{ bgcolor: "background.paper" }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3 }}>
                  {selectedStyleId && (
                    <Typography variant="body2" fontWeight={500} color="text.secondary">
                      Ready to transform?
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    size="large"
                    disabled={redesignState === AppState.GENERATING || !selectedStyleId}
                    onClick={handleRedesign}
                    startIcon={redesignState === AppState.GENERATING ? <CircularProgress size={20} color="inherit" /> : <WandIcon />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      background: redesignState === AppState.GENERATING || !selectedStyleId ? undefined : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    }}
                  >
                    {redesignState === AppState.GENERATING ? "Generating Design..." : "Generate Transformation"}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      );
    }

    // COMPLETE
    if (
      (redesignState === AppState.COMPLETE ||
        (redesignState === AppState.GENERATING && generatedRedesign)) &&
      originalImage
    ) {
      return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
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
            <Fab
              color="primary"
              variant="extended"
              onClick={() => setIsChatOpen(true)}
              sx={{
                position: "fixed",
                bottom: 24,
                left: 24,
                zIndex: 1200,
                fontWeight: "bold",
              }}
            >
              <ChatIcon sx={{ mr: 1 }} />
              Talk to Designer
            </Fab>
          )}

          <Paper sx={{ p: 4, borderRadius: 4, mb: 4, display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "flex-end" }, justifyContent: "space-between", gap: 3 }}>
            <Box>
              <Chip icon={<CheckIcon />} label="Design Complete" color="success" sx={{ mb: 2, fontWeight: "bold" }} />
              <Typography variant="h3" fontWeight={800} gutterBottom>
                Your Dream Space
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Drag the slider to reveal the transformation.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setGeneratedRedesign(null);
                  setRedesignState(AppState.SELECTION);
                }}
              >
                Try Another Style
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                href={generatedRedesign!}
                download="lumina-redesign.png"
              >
                Download HD
              </Button>
            </Stack>
          </Paper>

          <Box sx={{ position: "relative", borderRadius: 6, overflow: "hidden", boxShadow: theme.shadows[10], mb: 4 }}>
            {redesignState === AppState.GENERATING && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.common.white, 0.6),
                  backdropFilter: "blur(4px)",
                }}
              >
                <Paper sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, borderRadius: 4 }}>
                  <CircularProgress />
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h6" fontWeight="bold">Refining Design...</Typography>
                    <Typography variant="body2" color="text.secondary">Applying your feedback</Typography>
                  </Box>
                </Paper>
              </Box>
            )}
            <BeforeAfterSlider
              beforeImage={originalImage}
              afterImage={generatedRedesign!}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: 4, height: "100%" }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <SparklesIcon color="primary" /> Style Applied
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {selectedStyleId === "custom"
                    ? `Custom: "${customPrompt}"`
                    : selectedStyleId?.startsWith("suggested-")
                      ? analysis?.suggestedPrompts[
                          parseInt(selectedStyleId.split("-")[1]!)
                        ]?.title
                      : DESIGN_STYLES.find((s) => s.id === selectedStyleId)
                          ?.name ?? "Refined Design"}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                onClick={resetRedesign}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  height: "100%",
                  cursor: "pointer",
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${theme.palette.background.paper})`,
                  border: 1,
                  borderColor: "primary.100",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "scale(1.01)",
                  },
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    Start New Project
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload a different room photo
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "50%", bgcolor: "background.paper", boxShadow: 1, color: "primary.main" }}>
                  <ArrowRightIcon />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      );
    }

    return null;
  };

  const renderGenerateFlow = () => (
    <Container maxWidth="md" sx={{ py: 10 }}>
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <Box
          sx={{
            mx: "auto",
            mb: 3,
            width: 64,
            height: 64,
            borderRadius: 3,
            bgcolor: "secondary.50",
            color: "secondary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImagePlusIcon fontSize="large" />
        </Box>
        <Typography variant="h2" fontWeight={800} gutterBottom>
          Text to Reality
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
          Generate completely new interior concepts from scratch using Imagen 4.0. No existing photo required.
        </Typography>
      </Box>

      <Paper sx={{ p: 6, borderRadius: 6, border: 1, borderColor: "divider" }}>
        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 2, textTransform: "uppercase" }}>
          Describe your imagination
        </Typography>
        <Box sx={{ position: "relative" }}>
          <TextField
            fullWidth
            multiline
            minRows={6}
            placeholder="e.g. 'A futuristic bedroom with a glass ceiling looking out into deep space, neon blue accent lighting, sleek white furniture, hyper-realistic 8k render'"
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.default",
                fontSize: "1.1rem",
              },
            }}
          />
          <Chip
            label="Powered by Imagen 4.0"
            size="small"
            sx={{ position: "absolute", bottom: 16, right: 16, bgcolor: "background.paper" }}
          />
        </Box>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="large"
            color="secondary"
            onClick={handleGenerateNew}
            disabled={generateState === AppState.GENERATING}
            startIcon={generateState === AppState.GENERATING ? <CircularProgress size={20} color="inherit" /> : <SparklesIcon />}
            sx={{ px: 5, py: 1.5, borderRadius: 3 }}
          >
            Generate Concept
          </Button>
        </Box>
      </Paper>
    </Container>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 10 }}>
      {/* Navigation Tabs */}
      <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
        <Paper
          elevation={0}
          sx={{
            p: 0.5,
            borderRadius: 50,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            display: "flex",
          }}
        >
          <Button
            onClick={() => setActiveTab(Tab.REDESIGN)}
            variant={activeTab === Tab.REDESIGN ? "contained" : "text"}
            color="primary"
            sx={{
              borderRadius: 50,
              px: 3,
              bgcolor: activeTab === Tab.REDESIGN ? "primary.main" : "transparent",
              color: activeTab === Tab.REDESIGN ? "white" : "text.secondary",
              "&:hover": { bgcolor: activeTab === Tab.REDESIGN ? "primary.dark" : "action.hover" },
            }}
          >
            Redesign Room
          </Button>
          <Button
            onClick={() => setActiveTab(Tab.GENERATE)}
            variant={activeTab === Tab.GENERATE ? "contained" : "text"}
            color="secondary"
            sx={{
              borderRadius: 50,
              px: 3,
              bgcolor: activeTab === Tab.GENERATE ? "secondary.main" : "transparent",
              color: activeTab === Tab.GENERATE ? "white" : "text.secondary",
              "&:hover": { bgcolor: activeTab === Tab.GENERATE ? "secondary.dark" : "action.hover" },
            }}
          >
            Generate New
          </Button>
        </Paper>
      </Box>

      {activeTab === Tab.REDESIGN && (
        <>
          <StepIndicator />
          {renderRedesignFlow()}
        </>
      )}

      {activeTab === Tab.GENERATE && renderGenerateFlow()}

      <ContextSelectionModal />
    </Box>
  );
}

function DividerWithText({ text }: { text: string }) {
  return (
    <Box sx={{ position: "relative", my: 4 }}>
      <Box sx={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: 1, borderColor: "divider" }} />
      <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
        <Typography
          variant="caption"
          fontWeight="bold"
          sx={{ bgcolor: "background.paper", px: 2, color: "text.disabled", textTransform: "uppercase" }}
        >
          {text}
        </Typography>
      </Box>
    </Box>
  );
}
