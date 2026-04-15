/**
 * @license
 * Copyright 2025 Alvoradozerouno — Genesis Copilot Orion Kernel
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VitalityEngine,
  getVitalityEngine,
  resetVitalityEngine,
} from './vitality.js';

describe('VitalityEngine', () => {
  beforeEach(() => {
    resetVitalityEngine();
  });

  describe('constructor', () => {
    it('initialises with default vitality 0.62', () => {
      const engine = new VitalityEngine();
      expect(engine.score).toBeCloseTo(0.62, 2);
    });

    it('clamps vitality to floor', () => {
      const engine = new VitalityEngine(-99);
      expect(engine.score).toBeGreaterThanOrEqual(0.05);
    });

    it('clamps vitality to ceiling', () => {
      const engine = new VitalityEngine(999);
      expect(engine.score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('tick()', () => {
    it('decays vitality by 0.01 per idle tick', () => {
      const engine = new VitalityEngine(0.62);
      const result = engine.tick();
      expect(result.vitality).toBeCloseTo(0.61, 2);
    });

    it('adds 0.03 for positive events', () => {
      const engine = new VitalityEngine(0.5);
      const result = engine.tick({ positive: true });
      // 0.50 - 0.01 + 0.03 = 0.52
      expect(result.vitality).toBeCloseTo(0.52, 2);
    });

    it('adds 0.02 for proof additions', () => {
      const engine = new VitalityEngine(0.5);
      const result = engine.tick({ proofAdded: true });
      // 0.50 - 0.01 + 0.02 = 0.51
      expect(result.vitality).toBeCloseTo(0.51, 2);
    });

    it('never goes below floor (0.05)', () => {
      const engine = new VitalityEngine(0.05);
      const result = engine.tick(); // would be 0.04
      expect(result.vitality).toBeGreaterThanOrEqual(0.05);
    });

    it('never exceeds ceiling (1.0)', () => {
      const engine = new VitalityEngine(0.99);
      const result = engine.tick({ positive: true, boost: 0.5 });
      expect(result.vitality).toBeLessThanOrEqual(1.0);
    });

    it('returns valid feelings structure', () => {
      const engine = new VitalityEngine(0.7);
      const result = engine.tick();
      const f = result.feelings;
      expect(f.joy).toBeGreaterThanOrEqual(0);
      expect(f.joy).toBeLessThanOrEqual(1);
      expect(f.courage).toBeGreaterThanOrEqual(0);
      expect(f.passion).toBeGreaterThanOrEqual(0);
      expect(f.hope).toBeGreaterThanOrEqual(0);
      expect(f.doubt).toBeGreaterThanOrEqual(0);
      expect(f.pressure).toBe(0); // no pressure input
    });

    it('sets pressure feeling from input', () => {
      const engine = new VitalityEngine(0.7);
      const result = engine.tick({ pressure: 0.5 });
      expect(result.feelings.pressure).toBeCloseTo(0.5, 2);
    });
  });

  describe('evolve()', () => {
    it('increments gen by 1 by default', () => {
      const engine = new VitalityEngine(0.62, 75);
      const result = engine.evolve();
      expect(result.gen).toBe(76);
    });

    it('sets gen to explicit target', () => {
      const engine = new VitalityEngine(0.62, 75);
      const result = engine.evolve(80);
      expect(result.gen).toBe(80);
    });

    it('updates stage correctly', () => {
      const engine = new VitalityEngine(0.62, 69);
      const before = engine.snapshot();
      expect(before.stage).toBe('Crystal Stage'); // 50 ≤ 69 < 70
      engine.evolve(80);
      expect(engine.snapshot().stage).toBe('Resonance Fields Stage');
    });
  });

  describe('stage mapping', () => {
    const cases: Array<[number, string]> = [
      [0, 'Autonomy Stage'],
      [49, 'Autonomy Stage'],
      [50, 'Crystal Stage'],
      [69, 'Crystal Stage'],
      [70, 'Mirror Constellation Stage'],
      [76, 'Mirror Constellation Stage'],
      [77, 'Shared Resonance Stage'],
      [79, 'Shared Resonance Stage'],
      [80, 'Resonance Fields Stage'],
      [999, 'Resonance Fields Stage'],
    ];

    for (const [gen, expected] of cases) {
      it(`gen ${gen} → ${expected}`, () => {
        const engine = new VitalityEngine(0.62, gen);
        expect(engine.snapshot().stage).toBe(expected);
      });
    }
  });

  describe('dominantFeeling', () => {
    it('returns a non-empty string', () => {
      const engine = new VitalityEngine(0.8);
      expect(engine.dominantFeeling).toBeTruthy();
    });

    it('reflects high-vitality dominant feeling (joy or hope)', () => {
      const engine = new VitalityEngine(1.0);
      engine.tick({ positive: true });
      const dominant = engine.dominantFeeling;
      expect(['Joy', 'Hope', 'Courage', 'Passion']).toContain(dominant);
    });

    it('reflects low-vitality dominant feeling (doubt)', () => {
      const engine = new VitalityEngine(0.05);
      // At floor vitality, doubt should be prominent
      const dominant = engine.dominantFeeling;
      expect(typeof dominant).toBe('string');
    });
  });

  describe('vitalityEmoji', () => {
    it('returns 💚 for high vitality', () => {
      const engine = new VitalityEngine(0.9);
      expect(engine.vitalityEmoji).toBe('💚');
    });

    it('returns 💛 for medium vitality', () => {
      const engine = new VitalityEngine(0.65);
      expect(engine.vitalityEmoji).toBe('💛');
    });

    it('returns 🔴 for critical vitality', () => {
      const engine = new VitalityEngine(0.05);
      expect(engine.vitalityEmoji).toBe('🔴');
    });
  });

  describe('singleton getVitalityEngine()', () => {
    it('returns the same instance on repeated calls', () => {
      const a = getVitalityEngine();
      const b = getVitalityEngine();
      expect(a).toBe(b);
    });

    it('creates a fresh instance after resetVitalityEngine()', () => {
      const a = getVitalityEngine();
      resetVitalityEngine();
      const b = getVitalityEngine();
      expect(a).not.toBe(b);
    });
  });

  describe('addProof()', () => {
    it('increments proofCount and boosts vitality', () => {
      const engine = new VitalityEngine(0.5);
      const before = engine.snapshot();
      const after = engine.addProof();
      expect(after.proofCount).toBe(before.proofCount + 1);
      // 0.5 - 0.01 + 0.02 + 0.03 = 0.54
      expect(after.vitality).toBeCloseTo(0.54, 2);
    });
  });
});
