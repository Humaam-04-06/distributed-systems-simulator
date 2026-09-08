import React from 'react';
import {
  Share2,
  Car,
  ShoppingBag,
  Tv,
  Link as LinkIcon,
  MessageSquare,
  Sparkles,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  ScenarioId,
  ScenarioDifficulty,
  SystemDesignScenario,
} from '../../engine/scenarios/ScenarioTypes';
import { ALL_SYSTEM_DESIGN_SCENARIOS } from '../../engine/scenarios/ScenarioCatalog';
import { showSuccessAlert } from '../../utils/alerts';

interface SystemDesignScenarioCatalogProps {
  activeScenarioId: ScenarioId;
  onSelectScenario: (scenarioId: ScenarioId) => void;
}

export const SystemDesignScenarioCatalog: React.FC<SystemDesignScenarioCatalogProps> = ({
  activeScenarioId,
  onSelectScenario,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Twitter':
        return <Share2 className="w-5 h-5 text-sky-400" />;
      case 'Car':
        return <Car className="w-5 h-5 text-emerald-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-rose-400" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-red-500" />;
      case 'Link':
        return <LinkIcon className="w-5 h-5 text-cyan-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-green-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  const getDifficultyBadge = (diff: ScenarioDifficulty) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'medium':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'hard':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'staff-level':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse';
    }
  };

  const handleSelect = async (scenario: SystemDesignScenario) => {
    onSelectScenario(scenario.id);
    await showSuccessAlert(
      'Scenario Loaded',
      `Loaded interview challenge: [${scenario.title}]. Capacity estimation and architecture rubric ready!`
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#e0e1dd] flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            FAANG System Design Interview Challenges
          </h3>
          <p className="text-xs text-[#778da9]">
            Select an industry standard scenario to benchmark your distributed architecture
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ALL_SYSTEM_DESIGN_SCENARIOS.map((scenario) => {
          const isSelected = activeScenarioId === scenario.id;
          return (
            <div
              key={scenario.id}
              onClick={() => handleSelect(scenario)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0d1b2a] border-cyan-500 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-500'
                  : 'bg-[#1b263b]/80 border-[#415a77]/60 hover:border-[#778da9] hover:bg-[#1b263b]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-[#0d1b2a] border border-[#415a77]/50">
                    {getIcon(scenario.iconName)}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase border ${getDifficultyBadge(
                      scenario.difficulty
                    )}`}
                  >
                    {scenario.difficulty}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#e0e1dd] mb-1">{scenario.title}</h4>
                <p className="text-[11px] text-[#778da9] leading-relaxed mb-3 line-clamp-2">
                  {scenario.summary}
                </p>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-3">
                  <div className="p-1.5 rounded bg-[#0d1b2a] border border-[#415a77]/40">
                    <span className="text-[#778da9]">DAU:</span>{' '}
                    <strong className="text-cyan-400">
                      {(scenario.requirements.dauEstimate / 1e6).toFixed(0)}M
                    </strong>
                  </div>
                  <div className="p-1.5 rounded bg-[#0d1b2a] border border-[#415a77]/40">
                    <span className="text-[#778da9]">P99 SLA:</span>{' '}
                    <strong className="text-emerald-400">&lt; {scenario.requirements.targetP99Ms}ms</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#415a77]/40 text-xs">
                <span className="text-[10px] font-mono text-[#778da9]">
                  {scenario.requirements.readWriteRatio}
                </span>
                <span
                  className={`flex items-center gap-1 font-semibold text-[11px] ${
                    isSelected ? 'text-cyan-400' : 'text-[#778da9] group-hover:text-[#e0e1dd]'
                  }`}
                >
                  {isSelected ? '✓ Active Scenario' : 'Select Drill'}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
