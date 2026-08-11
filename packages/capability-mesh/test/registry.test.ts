import { describe, expect, it } from 'vitest';
import { CapabilityRegistry } from '../src/registry.js';
import { normalizeMcpTool } from '../src/mcp-client.js';
import { intent } from './fixtures.js';

describe('CapabilityRegistry', () => {
  it('resolves only certified capability versions', () => {
    const registry = new CapabilityRegistry();
    registry.register({
      id: 'cap-version-1',
      capabilityId: intent.capabilityId,
      version: 1,
      status: 'certified',
      risk: 'R1',
      inputSchema: { type: 'object' },
      evidenceIds: ['approval-evidence'],
      integrityHash: 'sha256:certified',
    });

    expect(registry.resolve(intent)?.id).toBe('cap-version-1');
  });
});

describe('normalizeMcpTool', () => {
  it('maps MCP read-only and destructive annotations into Apeirosyntharch risk classes', () => {
    const read = normalizeMcpTool({
      name: 'search',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true },
    });
    const destructive = normalizeMcpTool({
      name: 'delete_record',
      inputSchema: { type: 'object' },
      annotations: { destructiveHint: true },
    });

    expect(read.risk).toBe('R0');
    expect(destructive.risk).toBe('R3');
  });
});
