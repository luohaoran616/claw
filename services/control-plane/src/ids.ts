import { ulid } from "ulid";

export function makeHandoffId(): string {
  return `hr_${ulid()}`;
}

export function makeApprovalId(): string {
  return `ap_${ulid()}`;
}

export function makeTaskRunId(): string {
  return `tr_${ulid()}`;
}

export function makeArtifactId(): string {
  return `af_${ulid()}`;
}

export function makeAuditEventId(): string {
  return `ae_${ulid()}`;
}
