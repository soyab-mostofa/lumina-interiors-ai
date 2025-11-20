import React from "react";
import type { RoomAnalysis } from "~/types";
import {
  CheckCircle2,
  AlertTriangle,
  LayoutDashboard,
  Hammer,
  Lightbulb,
} from "lucide-react";

interface AnalysisPanelProps {
  analysis: RoomAnalysis;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="animate-fade-in rounded-3xl border border-white/50 bg-white/80 p-6 shadow-lg ring-1 ring-slate-900/5 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 text-white shadow-md shadow-indigo-200">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Room Analysis
            </h2>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {analysis.roomType ?? "Room"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Architectural Features */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 transition-shadow hover:shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Hammer size={14} className="text-indigo-500" /> Structure &
            Architecture
          </h3>
          <div className="flex flex-wrap gap-2">
            {(analysis.architecturalFeatures ?? [])
              .slice(0, 5)
              .map((item, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-indigo-100 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-900 shadow-sm"
                >
                  {item}
                </span>
              ))}
            {(!analysis.architecturalFeatures ||
              analysis.architecturalFeatures.length === 0) && (
              <span className="text-xs italic text-slate-400">
                None detected
              </span>
            )}
          </div>
        </div>

        {/* Decor Suggestions */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 transition-shadow hover:shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
            <Lightbulb size={14} className="text-emerald-500" /> Decor
            Opportunities
          </h3>
          <ul className="space-y-2">
            {(analysis.decorSuggestions ?? [])
              .slice(0, 3)
              .map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-emerald-500"
                  />
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
            {(!analysis.decorSuggestions ||
              analysis.decorSuggestions.length === 0) && (
              <li className="text-xs italic text-slate-400">
                No specific suggestions
              </li>
            )}
          </ul>
        </div>

        {/* Design Issues */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 transition-shadow hover:shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600/80">
            <AlertTriangle size={14} className="text-amber-500" /> Fixes Needed
          </h3>
          <ul className="space-y-2">
            {(analysis.designIssues ?? []).slice(0, 3).map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400"></span>
                <span className="leading-tight">{item}</span>
              </li>
            ))}
            {(!analysis.designIssues || analysis.designIssues.length === 0) && (
              <li className="text-xs italic text-slate-400">
                No major issues found
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
