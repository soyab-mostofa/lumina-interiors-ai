"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Stack,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  Lightbulb as LightbulbIcon,
  FiberManualRecord as DotIcon,
} from "@mui/icons-material";
import type { RoomAnalysis } from "~/types";

interface AnalysisPanelProps {
  analysis: RoomAnalysis;
}

export const AnalysisPanel = React.memo<AnalysisPanelProps>(({ analysis }) => {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 6,
        backdropFilter: "blur(12px)",
        background: (theme) =>
          `${alpha(theme.palette.background.paper, 0.8)}`,
        border: (theme) => `1px solid ${alpha("#fff", 0.5)}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, pb: 2, borderBottom: 1, borderColor: "divider" }}>
          <Avatar
            sx={{
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <DashboardIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.025em" }}>
              Room Analysis
            </Typography>
            <Typography
              variant="caption"
              fontWeight={600}
              textTransform="uppercase"
              sx={{ letterSpacing: "0.1em", color: "text.secondary" }}
            >
              {analysis.roomType ?? "Room"}
            </Typography>
          </Box>
        </Box>

        {/* Analysis Sections */}
        <Stack spacing={2}>
          {/* Architectural Features */}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: 1,
              borderColor: "primary.light",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              transition: "box-shadow 0.2s",
              "&:hover": {
                boxShadow: 1,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <BuildIcon fontSize="small" color="primary" />
              <Typography
                variant="caption"
                fontWeight={700}
                textTransform="uppercase"
                sx={{ letterSpacing: "0.1em", color: "primary.main" }}
              >
                Structure & Architecture
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(analysis.architecturalFeatures ?? []).slice(0, 5).map((item, idx) => (
                <Chip
                  key={idx}
                  label={item}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: "background.paper",
                    borderColor: "primary.light",
                    border: 1,
                  }}
                />
              ))}
              {(!analysis.architecturalFeatures || analysis.architecturalFeatures.length === 0) && (
                <Typography variant="caption" fontStyle="italic" color="text.secondary">
                  None detected
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Decor Suggestions */}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: 1,
              borderColor: "success.light",
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
              transition: "box-shadow 0.2s",
              "&:hover": {
                boxShadow: 1,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <LightbulbIcon fontSize="small" color="success" />
              <Typography
                variant="caption"
                fontWeight={700}
                textTransform="uppercase"
                sx={{ letterSpacing: "0.1em", color: "success.main" }}
              >
                Decor Opportunities
              </Typography>
            </Box>
            <List dense disablePadding>
              {(analysis.decorSuggestions ?? []).slice(0, 3).map((item, idx) => (
                <ListItem key={idx} disablePadding sx={{ alignItems: "flex-start", mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{
                      variant: "body2",
                      sx: { lineHeight: 1.4 },
                    }}
                  />
                </ListItem>
              ))}
              {(!analysis.decorSuggestions || analysis.decorSuggestions.length === 0) && (
                <Typography variant="caption" fontStyle="italic" color="text.secondary">
                  No specific suggestions
                </Typography>
              )}
            </List>
          </Box>

          {/* Design Issues */}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: 1,
              borderColor: "warning.light",
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05),
              transition: "box-shadow 0.2s",
              "&:hover": {
                boxShadow: 1,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <WarningIcon fontSize="small" color="warning" />
              <Typography
                variant="caption"
                fontWeight={700}
                textTransform="uppercase"
                sx={{ letterSpacing: "0.1em", color: "warning.main" }}
              >
                Fixes Needed
              </Typography>
            </Box>
            <List dense disablePadding>
              {(analysis.designIssues ?? []).slice(0, 3).map((item, idx) => (
                <ListItem key={idx} disablePadding sx={{ alignItems: "flex-start", mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 20, mt: 1 }}>
                    <DotIcon sx={{ fontSize: 8, color: "warning.main" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{
                      variant: "body2",
                      sx: { lineHeight: 1.4 },
                    }}
                  />
                </ListItem>
              ))}
              {(!analysis.designIssues || analysis.designIssues.length === 0) && (
                <Typography variant="caption" fontStyle="italic" color="text.secondary">
                  No major issues found
                </Typography>
              )}
            </List>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
});
