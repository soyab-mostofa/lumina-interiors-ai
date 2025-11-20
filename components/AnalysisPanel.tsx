import React from 'react';
import { RoomAnalysis } from '../types';
import { CheckCircle2, AlertTriangle, Sparkles, LayoutDashboard, Hammer, Lightbulb } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: RoomAnalysis;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="bg-slate-100 p-2.5 rounded-lg">
          <LayoutDashboard size={18} className="text-slate-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Room Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">{analysis.roomType || 'Room'}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Architectural Features */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Hammer size={14} className="text-slate-500" />
            Structure & Architecture
          </h3>
          <div className="flex flex-wrap gap-2">
            {(analysis.architecturalFeatures || []).slice(0, 5).map((item, idx) => (
              <span
                key={idx}
                className="bg-white text-slate-700 text-xs font-medium px-3 py-1 rounded-md border border-slate-200"
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
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-2">
             <Lightbulb size={14} className="text-slate-500" />
             Decor Opportunities
          </h3>
          <ul className="space-y-2">
            {(analysis.decorSuggestions || []).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm">
                <CheckCircle2 size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
            {(!analysis.decorSuggestions || analysis.decorSuggestions.length === 0) && (
                 <li className="text-xs text-slate-400 italic">No specific suggestions</li>
            )}
          </ul>
        </div>

        {/* Design Issues */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-2">
             <AlertTriangle size={14} className="text-slate-500" />
             Fixes Needed
          </h3>
          <ul className="space-y-2">
            {(analysis.designIssues || []).slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
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