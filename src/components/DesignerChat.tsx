"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Stack,
  CircularProgress,
  Chip,
  InputAdornment,
  alpha,
} from "@mui/material";
import {
  Send as SendIcon,
  Close as CloseIcon,
  AutoAwesome as SparklesIcon,
} from "@mui/icons-material";
import type { ChatMessage, RoomAnalysis } from "~/types";
import { api } from "~/lib/trpc/client";
import { compressBase64 } from "~/lib/utils";

interface DesignerChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageBase64: string;
  originalImageBase64: string;
  analysis: RoomAnalysis | null;
  roomContext: "Residential" | "Commercial";
  onTriggerRedesign: (prompt: string) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const DesignerChat: React.FC<DesignerChatProps> = ({
  isOpen,
  onClose,
  currentImageBase64,
  originalImageBase64,
  analysis,
  roomContext,
  onTriggerRedesign,
  messages,
  setMessages,
}) => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC mutation for chat
  const chatMutation = api.roomAnalysis.chatRefine.useMutation();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input;
    setInput("");

    // Add User Message
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: userText,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      // Compress images before sending
      const compressedCurrent = await compressBase64(currentImageBase64);
      const compressedOriginal = await compressBase64(originalImageBase64);

      // Call tRPC endpoint
      const response = await chatMutation.mutateAsync({
        history: [...messages, newUserMsg],
        currentImageBase64: compressedCurrent,
        originalImageBase64: compressedOriginal,
        analysis,
        userMessage: userText,
        roomContext,
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: response.text,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If AI suggests a visual change
      if (response.newGenerationPrompt) {
        const sysMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "ai",
          text: "I'm applying those specific adjustments now...",
          isSystemMessage: true,
        };
        setMessages((prev) => [...prev, sysMsg]);
        onTriggerRedesign(response.newGenerationPrompt);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: "I'm sorry, I had trouble processing that request.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 1300,
        width: "100%",
        maxWidth: { xs: 360, md: 400 },
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        overflow: "hidden",
        animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "@keyframes scaleIn": {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "grey.900",
          color: "common.white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "grey.800",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 40,
                height: 40,
                color: "common.white",
              }}
            >
              <SparklesIcon fontSize="small" />
            </Avatar>
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "success.main",
                border: 2,
                borderColor: "grey.900",
              }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Lumina Designer
            </Typography>
            <Typography variant="caption" sx={{ color: "grey.400" }}>
              Online • {roomContext}{" "}
              {analysis?.roomType ? `(${analysis.roomType})` : ""}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "grey.400", "&:hover": { color: "common.white", bgcolor: "grey.800" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          height: 400,
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
          bgcolor: "background.paper", // Fallback
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9))",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ mt: 4, px: 2, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2" paragraph>
              👋 Hi! I'm Lumina.
            </Typography>
            <Typography variant="body2" paragraph>
              I can help you refine this {roomContext.toLowerCase()} space.
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 2, mb: 1 }}>
              Try specific commands:
            </Typography>
            <Stack spacing={1} alignItems="center">
              {[
                "Change only the wall color to sage green.",
                "Restore the original floor.",
              ].map((cmd, idx) => (
                <Chip
                  key={idx}
                  label={`"${cmd}"`}
                  onClick={() => setInput(cmd)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: "primary.50",
                    color: "primary.main",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    "&:hover": { bgcolor: "primary.100" },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.isSystemMessage ? (
              <Chip
                icon={<CircularProgress size={10} color="inherit" />}
                label={msg.text}
                size="small"
                sx={{
                  mx: "auto",
                  bgcolor: "primary.50",
                  color: "primary.main",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            ) : (
              <Paper
                elevation={0}
                sx={{
                  maxWidth: "85%",
                  p: 1.5,
                  px: 2,
                  borderRadius: 3,
                  ...(msg.role === "user"
                    ? {
                        bgcolor: "grey.900",
                        color: "common.white",
                        borderTopRightRadius: 0,
                      }
                    : {
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        color: "text.primary",
                        borderTopLeftRadius: 0,
                      }),
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {msg.text}
                </Typography>
              </Paper>
            )}
          </Box>
        ))}

        {isTyping && (
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                px: 2,
                borderRadius: 3,
                borderTopLeftRadius: 0,
                bgcolor: "grey.100",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  bgcolor: "grey.500",
                  borderRadius: "50%",
                  animation: "bounce 1.4s infinite ease-in-out both",
                  "@keyframes bounce": {
                    "0%, 80%, 100%": { transform: "scale(0)" },
                    "40%": { transform: "scale(1)" },
                  },
                }}
              />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  bgcolor: "grey.500",
                  borderRadius: "50%",
                  animation: "bounce 1.4s infinite ease-in-out both",
                  animationDelay: "0.16s",
                }}
              />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  bgcolor: "grey.500",
                  borderRadius: "50%",
                  animation: "bounce 1.4s infinite ease-in-out both",
                  animationDelay: "0.32s",
                }}
              />
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask for changes or to keep features..."
          variant="outlined"
          size="small"
          disabled={isTyping}
          InputProps={{
            sx: {
              borderRadius: 3,
              bgcolor: "grey.50",
              "& fieldset": { borderColor: "grey.200" },
              "&:hover fieldset": { borderColor: "primary.main" },
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  color="primary"
                  sx={{
                    bgcolor: input.trim() ? "primary.main" : "action.disabledBackground",
                    color: input.trim() ? "common.white" : "action.disabled",
                    "&:hover": {
                      bgcolor: input.trim() ? "primary.dark" : "action.disabledBackground",
                    },
                    width: 32,
                    height: 32,
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Paper>
  );
};

