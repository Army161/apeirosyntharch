import type { ActionIntent, ApprovalRecord, AuthorizationResult } from '@apeiro/contracts';

export class RiskGate {
  authorize(action: ActionIntent, approval?: ApprovalRecord): AuthorizationResult {
    if (action.risk === 'R0' || action.risk === 'R1') return { allowed: true };

    if (!approval || approval.status !== 'approved') {
      return { allowed: false, reason: 'approval_required' };
    }

    if (
      approval.actionId !== action.id ||
      approval.actionContentHash !== action.contentHash
    ) {
      return { allowed: false, reason: 'approval_mismatch' };
    }

    if (action.risk === 'R3' && Date.now() - approval.freshAuthorizationAt > 300_000) {
      return { allowed: false, reason: 'fresh_authorization_required' };
    }

    return { allowed: true };
  }
}

