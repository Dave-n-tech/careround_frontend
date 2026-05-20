import type { VhiStatus } from "@/types/domain";

// NEWS2-based Vitals Health Index scoring
// Diastolic BP is collected but not scored

export interface VhiBreakdown {
  pulse: number;
  systolicBp: number;
  respiratoryRate: number;
  temperature: number;
  spo2: number;
  total: number;
  status: VhiStatus;
}

function scoreRR(rr: number): number {
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}

function scoreSpO2(spo2: number): number {
  if (spo2 >= 96) return 0;
  if (spo2 >= 94) return 1;
  if (spo2 >= 92) return 2;
  return 3;
}

function scoreSystolicBP(sbp: number): number {
  if (sbp <= 90) return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 3;
}

function scorePulse(pulse: number): number {
  if (pulse <= 40) return 3;
  if (pulse <= 50) return 1;
  if (pulse <= 90) return 0;
  if (pulse <= 110) return 1;
  if (pulse <= 130) return 2;
  return 3;
}

function scoreTemp(temp: number): number {
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2;
}

export function vhiStatusFromScore(score: number): VhiStatus {
  if (score <= 2) return "STABLE";
  if (score <= 4) return "WATCH";
  return "CRITICAL";
}

export function computeVhi(vitals: {
  pulse?: number | string;
  systolicBp?: number | string;
  respiratoryRate?: number | string;
  temperature?: number | string;
  spo2?: number | string;
}): VhiBreakdown {
  const p = Number(vitals.pulse) || 0;
  const sbp = Number(vitals.systolicBp) || 0;
  const rr = Number(vitals.respiratoryRate) || 0;
  const temp = Number(vitals.temperature) || 0;
  const spo2 = Number(vitals.spo2) || 0;

  const scores = {
    pulse: p > 0 ? scorePulse(p) : 0,
    systolicBp: sbp > 0 ? scoreSystolicBP(sbp) : 0,
    respiratoryRate: rr > 0 ? scoreRR(rr) : 0,
    temperature: temp > 0 ? scoreTemp(temp) : 0,
    spo2: spo2 > 0 ? scoreSpO2(spo2) : 0,
  };

  const total = scores.pulse + scores.systolicBp + scores.respiratoryRate + scores.temperature + scores.spo2;

  return { ...scores, total, status: vhiStatusFromScore(total) };
}

// Returns how many fields have values (used to decide when to show preview)
export function countFilledVitals(vitals: {
  pulse?: number | string;
  systolicBp?: number | string;
  respiratoryRate?: number | string;
  temperature?: number | string;
  spo2?: number | string;
}): number {
  return [vitals.pulse, vitals.systolicBp, vitals.respiratoryRate, vitals.temperature, vitals.spo2]
    .filter((v) => v !== undefined && v !== "" && Number(v) > 0).length;
}
