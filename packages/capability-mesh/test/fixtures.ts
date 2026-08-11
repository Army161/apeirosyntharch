import { randomUUID } from 'node:crypto';
import type { ActionIntent } from '@apeiro/contracts';
import { CapabilityGenesis, type CapabilityCodeGenerator } from '../src/capability-genesis.js';

export const intent: ActionIntent = {
  id: randomUUID(),
  capabilityId: 'generated.repository_inspector',
  arguments: { target: 'repository' },
  risk: 'R1',
  idempotencyKey: `genesis:${randomUUID()}`,
  preconditions: ['sandbox_only'],
  contentHash: 'sha256:capability-request',
};

export function createTestGenesis(): CapabilityGenesis {
  const generator: CapabilityCodeGenerator = {
    generate: async () => ({
      language: 'typescript',
      source: "export function inspect(input: string): string { return input.trim(); }",
    }),
  };
  return new CapabilityGenesis(generator);
}

