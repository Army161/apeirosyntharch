import { randomUUID } from 'node:crypto';
import type { ActionIntent } from '@apeiro/contracts';

export type GeneratedCapabilityStatus =
  | 'generated'
  | 'compiled'
  | 'sandbox_verified'
  | 'security_verified'
  | 'awaiting_approval'
  | 'certified'
  | 'rejected';

export interface GeneratedCapabilityCode {
  language: 'typescript';
  source: string;
}

export interface GeneratedCapability {
  id: string;
  capabilityId: string;
  status: GeneratedCapabilityStatus;
  code: GeneratedCapabilityCode;
  evidenceIds: string[];
}

export interface CapabilityCodeGenerator {
  generate(intent: ActionIntent): Promise<GeneratedCapabilityCode>;
}

const transitions: Record<GeneratedCapabilityStatus, GeneratedCapabilityStatus[]> = {
  generated: ['compiled', 'rejected'],
  compiled: ['sandbox_verified', 'rejected'],
  sandbox_verified: ['security_verified', 'rejected'],
  security_verified: ['awaiting_approval', 'rejected'],
  awaiting_approval: ['certified', 'rejected'],
  certified: [],
  rejected: [],
};

export class CapabilityGenesis {
  constructor(private readonly generator: CapabilityCodeGenerator) {}

  async generate(intent: ActionIntent): Promise<GeneratedCapability> {
    return {
      id: randomUUID(),
      capabilityId: intent.capabilityId,
      status: 'generated',
      code: await this.generator.generate(intent),
      evidenceIds: [],
    };
  }
}

export function advanceCapability(
  capability: GeneratedCapability,
  next: GeneratedCapabilityStatus,
  evidenceIds: string[],
): GeneratedCapability {
  if (!transitions[capability.status].includes(next)) {
    throw new Error('invalid_capability_transition');
  }
  if (evidenceIds.length === 0) throw new Error('transition_evidence_required');
  return {
    ...capability,
    status: next,
    evidenceIds: [...capability.evidenceIds, ...evidenceIds],
  };
}

