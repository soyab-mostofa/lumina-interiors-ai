import React from 'react';
import { RoomAnalysis } from '../types';
import { CheckCircle2, AlertTriangle, Sparkles, LayoutDashboard, Hammer, Lightbulb } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: RoomAnalysis;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
        <div className="bg-slate-900 p-3 rounded-xl shadow-sm">
          <LayoutDashboard size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Room Analysis</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">{analysis.roomType || 'Space Assessment'}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Architectural Features */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Hammer size={15} className="text-slate-600" />
            Structure & Architecture
          </h3>
          <div className="flex flex-wrap gap-2">
            {(analysis.architecturalFeatures || []).slice(0, 5).map((item, idx) => (
              <span
                key={idx}
                className="bg-white text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-shadow"
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
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
             <Lightbulb size={15} className="text-slate-600" />
             Decor Opportunities
          </h3>
          <ul className="space-y-3">
            {(analysis.decorSuggestions || []).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <span className="leading-relaxed font-medium">{item}</span>
              </li>
            ))}
            {(!analysis.decorSuggestions || analysis.decorSuggestions.length === 0) && (
                 <li className="text-xs text-slate-400 italic">No specific suggestions</li>
            )}
          </ul>
        </div>

        {/* Design Issues */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
             <AlertTriangle size={15} className="text-slate-600" />
             Areas to Improve
          </h3>
          <ul className="space-y-3">
            {(analysis.designIssues || []).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 shadow-sm"></span>
                <span className="leading-relaxed font-medium">{item}</span>
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