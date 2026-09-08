import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  X,
  ArrowRight,
  RotateCcw,
  Award,
  Sparkles,
} from 'lucide-react';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';
import {
  SystemDesignQuizCatalog,
  SystemDesignQuizQuestion,
} from '../../engine/scenarios/SystemDesignQuizQuestions';
import { showSuccessAlert } from '../../utils/alerts';

interface SystemDesignQuizModalProps {
  isOpen: boolean;
  scenarioId: ScenarioId;
  onClose: () => void;
}

export const SystemDesignQuizModal: React.FC<SystemDesignQuizModalProps> = ({
  isOpen,
  scenarioId,
  onClose,
}) => {
  const questions = SystemDesignQuizCatalog.getByScenario(scenarioId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen || questions.length === 0) return null;

  const currentQ: SystemDesignQuizQuestion = questions[currentIndex];
  const selectedOptionIndex = selectedAnswers[currentIndex];
  const hasAnswered = selectedOptionIndex !== undefined;

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    const updated = { ...selectedAnswers, [currentIndex]: idx };
    setSelectedAnswers(updated);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
      let correct = 0;
      questions.forEach((q, i) => {
        if (selectedAnswers[i] === q.correctAnswerIndex) correct++;
      });
      if (correct === questions.length) {
        await showSuccessAlert(
          'Perfect Quiz Score! (3/3)',
          'Demonstrated exemplary Staff Engineer architectural mastery.'
        );
      }
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
  };

  const correctCount = Object.entries(selectedAnswers).filter(([qIdx, ansIdx]) => {
    return questions[Number(qIdx)]?.correctAnswerIndex === ansIdx;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1b263b] border border-[#415a77] shadow-2xl p-6 flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#415a77]/60">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-[#e0e1dd]">
              Staff System Design Knowledge Quiz
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#778da9] hover:text-[#e0e1dd] hover:bg-[#0d1b2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isFinished ? (
          <div className="space-y-4">
            {/* Progress strip */}
            <div className="flex items-center justify-between text-xs font-mono text-[#778da9]">
              <span className="px-2 py-0.5 rounded bg-[#0d1b2a] border border-[#415a77]/40 text-cyan-300">
                {currentQ.conceptTag}
              </span>
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Question Card */}
            <div className="p-4 rounded-xl bg-[#0d1b2a] border border-[#415a77]/80 text-sm font-semibold text-[#e0e1dd] leading-relaxed">
              {currentQ.question}
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOptionIndex === idx;
                const isCorrect = idx === currentQ.correctAnswerIndex;

                let btnStyle = 'bg-[#0d1b2a]/70 border-[#415a77]/50 text-[#e0e1dd] hover:border-cyan-400';
                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
                  } else {
                    btnStyle = 'bg-[#0d1b2a]/40 border-[#415a77]/30 text-[#778da9] opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-sans transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] bg-[#1b263b] border border-[#415a77] flex-shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt}</span>
                    {hasAnswered && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                    {hasAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box once answered */}
            {hasAnswered && (
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/50 text-xs space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300 font-mono">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  ARCHITECTURAL RATIONALE:
                </div>
                <p className="text-[#e0e1dd] leading-relaxed font-sans">{currentQ.explanation}</p>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex items-center justify-end pt-3 border-t border-[#415a77]/60">
              <button
                onClick={handleNext}
                disabled={!hasAnswered}
                className={`flex items-center gap-1.5 py-2 px-5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                  hasAnswered
                    ? 'bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-[#415a77] opacity-50 cursor-not-allowed'
                }`}
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Finished Score Screen */
          <div className="p-6 rounded-2xl bg-[#0d1b2a] border border-[#415a77]/80 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/20 border border-amber-500/50 text-amber-400 text-3xl font-extrabold">
              🏆
            </div>
            <div>
              <h4 className="text-base font-bold text-[#e0e1dd]">
                Quiz Complete: {correctCount} / {questions.length} Correct
              </h4>
              <p className="text-xs text-[#778da9] mt-1">
                {correctCount === questions.length
                  ? 'Outstanding! You demonstrated staff-level system design depth.'
                  : 'Good review! Re-visit the architectural trade-off matrix for tricky concepts.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold bg-[#1b263b] hover:bg-[#415a77] text-[#e0e1dd] border border-[#415a77] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Quiz
              </button>
              <button
                onClick={onClose}
                className="py-2 px-6 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
