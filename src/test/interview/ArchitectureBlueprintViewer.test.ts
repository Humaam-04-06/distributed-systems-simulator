import { describe, it, expect } from 'vitest';
import { ArchitectureBlueprintViewer } from '../../engine/scenarios/ArchitectureBlueprintViewer';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('ArchitectureBlueprintViewer', () => {
  const scenarioIds: ScenarioId[] = [
    'twitter-feed',
    'uber-ride-matching',
    'black-friday-sale',
    'netflix-streaming',
    'url-shortener',
    'whatsapp-chat',
  ];

  it('should define complete naive and production blueprints for all scenarios', () => {
    scenarioIds.forEach((id) => {
      const blueprints = ArchitectureBlueprintViewer.getAllBlueprints(id);
      expect(blueprints).toBeDefined();
      expect(blueprints.naive).toBeDefined();
      expect(blueprints.production).toBeDefined();

      // Check Naive
      expect(blueprints.naive.tier).toBe('naive');
      expect(blueprints.naive.title).toBeTruthy();
      expect(blueprints.naive.asciiDiagram).toContain('[');
      expect(blueprints.naive.dataFlowSteps.length).toBeGreaterThanOrEqual(3);
      expect(blueprints.naive.protocols.length).toBeGreaterThanOrEqual(1);
      expect(blueprints.naive.spofsIdentified.length).toBeGreaterThanOrEqual(1);

      // Check Production
      expect(blueprints.production.tier).toBe('production');
      expect(blueprints.production.title).toBeTruthy();
      expect(blueprints.production.asciiDiagram).toContain('[');
      expect(blueprints.production.dataFlowSteps.length).toBeGreaterThanOrEqual(3);
      expect(blueprints.production.protocols.length).toBeGreaterThanOrEqual(2);
      expect(blueprints.production.spofsIdentified.length).toBe(0);
      expect(blueprints.production.resilienceMechanisms.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should retrieve individual blueprints by scenarioId and tier', () => {
    const naiveTwitter = ArchitectureBlueprintViewer.getBlueprint('twitter-feed', 'naive');
    expect(naiveTwitter.title).toContain('Twitter');
    expect(naiveTwitter.spofsIdentified).toContain('Single App Server (No load balancing)');

    const prodUber = ArchitectureBlueprintViewer.getBlueprint('uber-ride-matching', 'production');
    expect(prodUber.title).toContain('Uber');
    expect(prodUber.resilienceMechanisms).toContain('City-level Geo-Affinity partition isolation');
  });

  it('should format side-by-side comparisons with verified schema', () => {
    const comparison = ArchitectureBlueprintViewer.getSideBySideComparison('netflix-streaming');
    expect(comparison.naive.id).toBe('nflx-naive-blueprint');
    expect(comparison.production.id).toBe('nflx-production-blueprint');
    expect(comparison.production.resilienceMechanisms).toContain('Chaos Kong automated regional evacuation within 7 minutes');
  });
});
