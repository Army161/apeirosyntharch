import type { ActionIntent, RiskClass } from '@apeiro/contracts';

export interface CapabilityVersion {
  id: string;
  capabilityId: string;
  version: number;
  status: 'certified' | 'disabled';
  risk: RiskClass;
  inputSchema: Record<string, unknown>;
  evidenceIds: string[];
  integrityHash: string;
}

export class CapabilityRegistry {
  private readonly versions = new Map<string, CapabilityVersion[]>();

  register(capability: CapabilityVersion): void {
    if (capability.status !== 'certified') throw new Error('capability_not_certified');
    const existing = this.versions.get(capability.capabilityId) ?? [];
    this.versions.set(capability.capabilityId, [...existing, capability]);
  }

  resolve(intent: ActionIntent): CapabilityVersion | null {
    const candidates = this.versions.get(intent.capabilityId) ?? [];
    return candidates
      .filter(candidate => candidate.status === 'certified')
      .toSorted((left, right) => right.version - left.version)[0] ?? null;
  }
}

