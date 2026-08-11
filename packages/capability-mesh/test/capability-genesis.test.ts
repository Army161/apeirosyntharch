import { describe, expect, it } from 'vitest';
import { advanceCapability } from '../src/capability-genesis.js';
import { createTestGenesis, intent } from './fixtures.js';

describe('CapabilityGenesis', () => {
  it('creates an uncertified generated capability without production secrets', async () => {
    const generated = await createTestGenesis().generate(intent);

    expect(generated.status).toBe('generated');
    expect(generated.evidenceIds).toEqual([]);
    expect(JSON.stringify(generated)).not.toContain('productionSecretValue');
  });

  it('cannot self-certify or advance without evidence', async () => {
    const generated = await createTestGenesis().generate(intent);

    expect(() => advanceCapability(generated, 'certified', ['evidence-1'])).toThrow(
      'invalid_capability_transition',
    );
    expect(() => advanceCapability(generated, 'compiled', [])).toThrow(
      'transition_evidence_required',
    );
  });

  it('advances only through the certification chain', async () => {
    let capability = await createTestGenesis().generate(intent);
    capability = advanceCapability(capability, 'compiled', ['compile-evidence']);
    capability = advanceCapability(capability, 'sandbox_verified', ['sandbox-evidence']);
    capability = advanceCapability(capability, 'security_verified', ['security-evidence']);
    capability = advanceCapability(capability, 'awaiting_approval', ['review-evidence']);
    capability = advanceCapability(capability, 'certified', ['approval-evidence']);

    expect(capability.status).toBe('certified');
    expect(capability.evidenceIds).toHaveLength(5);
  });
});
