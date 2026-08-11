import type { RiskClass } from '@apeiro/contracts';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export type McpToolLike = Awaited<ReturnType<Client['listTools']>>['tools'][number];

export interface NormalizedMcpCapability {
  name: string;
  inputSchema: Record<string, unknown>;
  risk: RiskClass;
  idempotent: boolean;
  externalReach: boolean;
}

export function normalizeMcpTool(tool: McpToolLike): NormalizedMcpCapability {
  const annotations = tool.annotations ?? {};
  const risk: RiskClass = annotations.destructiveHint
    ? 'R3'
    : annotations.readOnlyHint
      ? 'R0'
      : annotations.openWorldHint
        ? 'R2'
        : 'R1';

  return {
    name: tool.name,
    inputSchema: tool.inputSchema,
    risk,
    idempotent: annotations.idempotentHint ?? false,
    externalReach: annotations.openWorldHint ?? false,
  };
}

export class McpCapabilityClient {
  constructor(private readonly client: Client) {}

  async listCapabilities(): Promise<NormalizedMcpCapability[]> {
    const result = await this.client.listTools();
    return result.tools.map(tool => normalizeMcpTool(tool));
  }

  async call(name: string, args: Record<string, unknown>) {
    return this.client.callTool({ name, arguments: args });
  }
}
