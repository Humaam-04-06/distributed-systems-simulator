/**
 * ScenarioSimulatorFactory — Factory & Registry for Scenario Simulation Engines
 * 
 * Provides unified creation, retrieval, and lifecycle control for all 6
 * System Design Interview Scenario domain simulators.
 */

import { ScenarioId } from '../ScenarioTypes';
import { IScenarioSimulator } from './ScenarioSimulatorTypes';
import { TwitterFanoutSimulator } from './TwitterFanoutSimulator';
import { UberGeohashSimulator } from './UberGeohashSimulator';
import { BlackFridayInventorySimulator } from './BlackFridayInventorySimulator';
import { NetflixStreamingSimulator } from './NetflixStreamingSimulator';
import { UrlShortenerSimulator } from './UrlShortenerSimulator';
import { WhatsAppMessagingSimulator } from './WhatsAppMessagingSimulator';

export class ScenarioSimulatorFactory {
  private static instanceMap: Map<ScenarioId, IScenarioSimulator> = new Map();

  /**
   * Creates or returns cached singleton instance of simulator for scenario
   */
  public static getSimulator(scenarioId: ScenarioId): IScenarioSimulator {
    let simulator = this.instanceMap.get(scenarioId);
    if (!simulator) {
      simulator = this.createSimulator(scenarioId);
      this.instanceMap.set(scenarioId, simulator);
    }
    return simulator;
  }

  /**
   * Instantiates fresh domain simulator
   */
  public static createSimulator(scenarioId: ScenarioId): IScenarioSimulator {
    switch (scenarioId) {
      case 'twitter-feed':
        return new TwitterFanoutSimulator();
      case 'uber-ride-matching':
        return new UberGeohashSimulator();
      case 'black-friday-sale':
        return new BlackFridayInventorySimulator();
      case 'netflix-streaming':
        return new NetflixStreamingSimulator();
      case 'url-shortener':
        return new UrlShortenerSimulator();
      case 'whatsapp-chat':
        return new WhatsAppMessagingSimulator();
      default:
        return new TwitterFanoutSimulator();
    }
  }

  /**
   * Returns list of all scenario IDs supported by domain simulators
   */
  public static getSupportedScenarios(): ScenarioId[] {
    return [
      'twitter-feed',
      'uber-ride-matching',
      'black-friday-sale',
      'netflix-streaming',
      'url-shortener',
      'whatsapp-chat',
    ];
  }

  /**
   * Resets all cached simulators
   */
  public static resetAll(): void {
    this.instanceMap.forEach((sim) => sim.reset());
    this.instanceMap.clear();
  }
}
