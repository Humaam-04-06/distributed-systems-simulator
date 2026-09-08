import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import { showSuccessAlert } from '../../utils/alerts';

interface InterviewScratchpadDrawerProps {
  isOpen: boolean;
  scenarioId: ScenarioId;
  onClose: () => void;
}

export const InterviewScratchpadDrawer: React.FC<InterviewScratchpadDrawerProps> = ({
  isOpen,
  scenarioId,
  onClose,
}) => {
  const storageKey = `dss_interview_scratchpad_${scenarioId}`;

  const getDefaultTemplate = (id: ScenarioId) => {
    return `// ==========================================
// SYSTEM DESIGN SCRATCHPAD: ${id.toUpperCase()}
// ==========================================

1. FUNCTIONAL REQUIREMENTS:
   - [ ] Core user action (read / write)
   - [ ] Push notifications / real-time updates
   - [ ] Search / discovery features

2. NON-FUNCTIONAL REQUIREMENTS & SLAs:
   - Target Availability: 99.99% (Four Nines)
   - Latency SLA: P99 < 100ms
   - Eventual vs Strong Consistency: 

3. ESTIMATIONS (NAPKIN MATH):
   - DAU: 
   - Peak QPS: 
   - Storage / 5-years: 

4. DATA MODEL & PARTITION KEYS:
   - Primary DB: 
   - Partition Key: 
   - Caching Strategy (Redis): 

5. SPOFs & FAILURE MODES:
   - Circuit breakers for downstream services
   - Read-replica lag mitigation
`;
  };

  const [notes, setNotes] = useState<string>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved || getDefaultTemplate(scenarioId);
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setNotes(saved || getDefaultTemplate(scenarioId));
  }, [scenarioId, storageKey]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem(storageKey, val);
  };

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(notes);
    }
    await showSuccessAlert(
      'Copied to Clipboard',
      'Candidate scratchpad notes copied successfully.'
    );
  };

  const handleReset = async () => {
    const def = getDefaultTemplate(scenarioId);
    setNotes(def);
    localStorage.setItem(storageKey, def);
    await showSuccessAlert(
      'Scratchpad Reset',
      'Restored interview notes template.'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#1b263b] border-l border-[#415a77] shadow-2xl flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#415a77]/60 bg-[#0d1b2a]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#e0e1dd]">
              Candidate Interview Scratchpad
            </h4>
            <div className="text-[10px] text-[#778da9]">
              Scenario: <span className="text-cyan-300 font-mono">{scenarioId}</span> (Auto-saved)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#1b263b] transition-colors"
            title="Copy notes"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#1b263b] transition-colors"
            title="Reset template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#1b263b] transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-4 flex flex-col space-y-2 overflow-hidden bg-[#0d1b2a]">
        <div className="flex items-center justify-between text-[11px] text-[#778da9]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Markdown and ASCII diagram ready
          </span>
          <span className="font-mono text-[10px]">{notes.length} chars</span>
        </div>

        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Type candidate notes, schemas, or napkin-math here..."
          className="flex-1 w-full p-4 rounded-xl bg-[#1b263b] border border-[#415a77]/80 text-[#e0e1dd] font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-400 resize-none selection:bg-cyan-500/30"
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#415a77]/60 bg-[#0d1b2a] flex items-center justify-between text-[11px] text-[#778da9]">
        <span>Saved to browser local storage</span>
        <button
          onClick={onClose}
          className="py-1 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all text-xs cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
