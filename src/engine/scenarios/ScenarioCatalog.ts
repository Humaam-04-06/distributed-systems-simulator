/**
 * ScenarioCatalog — Aggregator & Index of all System Design Interview Scenarios
 */

import {
  ScenarioId,
  ScenarioCategory,
  ScenarioDifficulty,
  SystemDesignScenario,
} from './ScenarioTypes';
import { TWITTER_FEED_SCENARIO } from './TwitterFeedScenario';
import { UBER_RIDE_MATCHING_SCENARIO } from './UberRideMatchingScenario';
import { BLACK_FRIDAY_SALE_SCENARIO } from './BlackFridaySaleScenario';
import { NETFLIX_STREAMING_SCENARIO } from './NetflixStreamingScenario';
import { URL_SHORTENER_SCENARIO } from './UrlShortenerScenario';
import { WHATSAPP_CHAT_SCENARIO } from './WhatsAppChatScenario';

export const ALL_SYSTEM_DESIGN_SCENARIOS: SystemDesignScenario[] = [
  TWITTER_FEED_SCENARIO,
  UBER_RIDE_MATCHING_SCENARIO,
  BLACK_FRIDAY_SALE_SCENARIO,
  NETFLIX_STREAMING_SCENARIO,
  URL_SHORTENER_SCENARIO,
  WHATSAPP_CHAT_SCENARIO,
];

export class ScenarioCatalog {
  private scenarios: Map<ScenarioId, SystemDesignScenario> = new Map();

  constructor() {
    ALL_SYSTEM_DESIGN_SCENARIOS.forEach((s) => {
      this.scenarios.set(s.id, s);
    });
  }

  public getAll(): SystemDesignScenario[] {
    return Array.from(this.scenarios.values());
  }

  public getById(id: ScenarioId): SystemDesignScenario | undefined {
    return this.scenarios.get(id);
  }

  public getByCategory(category: ScenarioCategory): SystemDesignScenario[] {
    return this.getAll().filter((s) => s.category === category);
  }

  public getByDifficulty(difficulty: ScenarioDifficulty): SystemDesignScenario[] {
    return this.getAll().filter((s) => s.difficulty === difficulty);
  }

  public getIds(): ScenarioId[] {
    return Array.from(this.scenarios.keys());
  }
}

export const globalScenarioCatalog = new ScenarioCatalog();
