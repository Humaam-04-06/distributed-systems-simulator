import { describe, it, expect } from 'vitest';
import {
  ArchitecturePresetsCatalog,
} from '../../engine/scenarios/ArchitecturePresets';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('ArchitecturePresetsCatalog', () => {
  it('should contain 12 architectural presets total (naive and production for each scenario)', () => {
    const all = ArchitecturePresetsCatalog.getAll();
    expect(all.length).toBe(12);
  });

  it('should provide both a naive and production blueprint for every scenario', () => {
    const scenarios: ScenarioId[] = [
      'twitter-feed',
      'uber-ride-matching',
      'black-friday-sale',
      'netflix-streaming',
      'url-shortener',
      'whatsapp-chat',
    ];

    scenarios.forEach((s) => {
      const presets = ArchitecturePresetsCatalog.getByScenario(s);
      expect(presets.length).toBe(2);

      const naive = presets.find((p) => p.tier === 'naive');
      const prod = presets.find((p) => p.tier === 'production');

      expect(naive).toBeDefined();
      expect(prod).toBeDefined();

      // Naive checks
      expect(['C', 'D', 'F']).toContain(naive?.expectedGrade);
      expect(naive?.spofsPresent.length).toBeGreaterThan(0);

      // Production checks
      expect(['A', 'A+']).toContain(prod?.expectedGrade);
      expect(prod?.cacheEnabled).toBe(true);
      expect(prod?.replicationEnabled).toBe(true);
      expect(prod?.serverCount).toBeGreaterThan(1);
    });
  });

  it('should retrieve preset by unique ID', () => {
    const preset = ArchitecturePresetsCatalog.getById('twitter-production');
    expect(preset).toBeDefined();
    expect(preset?.name).toContain('Hybrid Fanout');
    expect(preset?.tier).toBe('production');
  });
});
