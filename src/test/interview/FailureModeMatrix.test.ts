import { describe, it, expect } from 'vitest';
import {
  FailureModeMatrix,
  FailureModeCaseStudies,
} from '../../engine/scenarios/FailureModeMatrix';
import { ScenarioId } from '../../engine/scenarios/ScenarioTypes';

describe('FailureModeMatrix', () => {
  const scenarioIds: ScenarioId[] = [
    'twitter-feed',
    'uber-ride-matching',
    'black-friday-sale',
    'netflix-streaming',
    'url-shortener',
    'whatsapp-chat',
  ];

  it('should provide at least 2 in-depth case studies for all 6 scenarios', () => {
    scenarioIds.forEach((scenarioId) => {
      const studies = FailureModeMatrix.getCaseStudies(scenarioId);
      expect(studies.length).toBeGreaterThanOrEqual(2);
      studies.forEach((study) => {
        expect(study.id).toBeTruthy();
        expect(study.scenarioId).toBe(scenarioId);
        expect(study.title).toBeTruthy();
        expect(study.realWorldIncident).toBeTruthy();
        expect(study.incidentYear).toBeGreaterThanOrEqual(2000);
        expect(study.companyOrContext).toBeTruthy();
        expect(['CRITICAL', 'HIGH', 'MEDIUM']).toContain(study.severity);
        expect(study.durationHours).toBeGreaterThan(0);
        expect(study.estimatedImpact).toBeTruthy();
        expect(study.symptoms.length).toBeGreaterThan(0);
        expect(study.rootCause).toBeTruthy();
        expect(study.naiveArchitecturalFlaw).toBeTruthy();
        expect(study.staffEngineeringRemediation.length).toBeGreaterThan(0);
        expect(study.keyTakeaway).toBeTruthy();
      });
    });
  });

  it('should lookup individual case studies by id', () => {
    const study = FailureModeMatrix.getCaseStudyById('tw-fail-whale-2010');
    expect(study).toBeDefined();
    expect(study?.companyOrContext).toBe('Twitter');
    expect(study?.severity).toBe('CRITICAL');
    expect(study?.rootCause).toContain('Synchronous Fan-out on Write');

    const nonexistent = FailureModeMatrix.getCaseStudyById('non-existent-case-id');
    expect(nonexistent).toBeUndefined();
  });

  it('should aggregate all case studies and identify critical severity outages', () => {
    const all = FailureModeMatrix.getAllCaseStudies();
    expect(all.length).toBe(12);

    const critical = FailureModeMatrix.getCriticalCaseStudies();
    expect(critical.length).toBeGreaterThanOrEqual(4);
    critical.forEach((study) => {
      expect(study.severity).toBe('CRITICAL');
    });
  });
});
