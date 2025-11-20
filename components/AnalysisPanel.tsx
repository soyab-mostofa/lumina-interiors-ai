import React from 'react';
import { RoomAnalysis } from '../types';
import { CheckCircle2, AlertTriangle, Sparkles, LayoutDashboard, Hammer, Lightbulb } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: RoomAnalysis;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="glass-card animate-fade-in hover-lift">
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl opacity-20 blur-xl"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl text-white shadow-glow animate-float">
              <LayoutDashboard size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight gradient-text">Room Analysis</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{analysis.roomType || 'Room'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Architectural Features */}
        <div className="group relative bg-gradient-to-br from-indigo-50/80 to-purple-50/50 rounded-2xl p-5 border border-indigo-200/60 hover:border-indigo-300/80 hover:shadow-soft transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
          <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Hammer size={15} className="text-indigo-600" /> Structure & Architecture
          </h3>
          <div className="flex flex-wrap gap-2">
            {(analysis.architecturalFeatures || []).slice(0, 5).map((item, idx) => (
              <span
                key={idx}
                className="bg-white/90 text-indigo-900 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200/60 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 hover-shimmer backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
            {(!analysis.architecturalFeatures || analysis.architecturalFeatures.length === 0) && (
                 <span className="text-xs text-slate-400 italic">None detected</span>
            )}
          </div>
        </div>

        {/* Decor Suggestions */}
        <div className="group relative bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl p-5 border border-emerald-200/60 hover:border-emerald-300/80 hover:shadow-soft transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Lightbulb size={15} className="text-emerald-600" /> Decor Opportunities
          </h3>
          <ul className="space-y-2.5">
            {(analysis.decorSuggestions || []).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-700 text-sm group/item">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
            {(!analysis.decorSuggestions || analysis.decorSuggestions.length === 0) && (
                 <li className="text-xs text-slate-400 italic">No specific suggestions</li>
            )}
          </ul>
        </div>

        {/* Design Issues */}
        <div className="group relative bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-2xl p-5 border border-amber-200/60 hover:border-amber-300/80 hover:shadow-soft transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
          <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
             <AlertTriangle size={15} className="text-amber-600" /> Fixes Needed
          </h3>
          <ul className="space-y-2.5">
            {(analysis.designIssues || []).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-700 text-sm group/item">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 group-hover/item:scale-125 transition-transform"></span>
                <span className="leading-relaxed">{item}</span>
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