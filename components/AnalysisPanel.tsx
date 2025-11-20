import React from 'react';
import { RoomAnalysis } from '../types';
import { CheckCircle2, AlertTriangle, Sparkles, LayoutDashboard, Hammer, Lightbulb } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: RoomAnalysis;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/50 animate-fade-in ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-indigo-200 shadow-md">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Room Analysis</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{analysis.roomType || 'Room'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Architectural Features */}
        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 hover:shadow-sm transition-shadow">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Hammer size={14} className="text-indigo-500" /> Structure & Architecture
          </h3>
          <div className="flex flex-wrap gap-2">
            {(analysis.architecturalFeatures || []).slice(0, 5).map((item, idx) => (
              <span key={idx} className="bg-white text-indigo-900 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm">
                {item}
              </span>
            ))}
            {(!analysis.architecturalFeatures || analysis.architecturalFeatures.length === 0) && (
                 <span className="text-xs text-slate-400 italic">None detected</span>
            )}
          </div>
        </div>

        {/* Decor Suggestions */}
        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 hover:shadow-sm transition-shadow">
          <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Lightbulb size={14} className="text-emerald-500" /> Decor Opportunities
          </h3>
          <ul className="space-y-2">
            {(analysis.decorSuggestions || []).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-700 text-sm">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="leading-tight">{item}</span>
              </li>
            ))}
            {(!analysis.decorSuggestions || analysis.decorSuggestions.length === 0) && (
                 <li className="text-xs text-slate-400 italic">No specific suggestions</li>
            )}
          </ul>
        </div>

        {/* Design Issues */}
        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 hover:shadow-sm transition-shadow">
          <h3 className="text-xs font-bold text-amber-600/80 uppercase tracking-wider mb-3 flex items-center gap-2">
             <AlertTriangle size={14} className="text-amber-500" /> Fixes Needed
          </h3>
          <ul className="space-y-2">
            {(analysis.designIssues || []).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-700 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                <span className="leading-tight">{item}</span>
              </li>
            ))}
             {(!analysis.designIssues || analysis.designIssues.length === 0) && (
                 <li className="text-xs text-slate-400 italic">No major issues found</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};