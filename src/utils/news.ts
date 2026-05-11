type NewsInput = {
  resp?: number | string;
  spo2?: number | string;
  temp?: number | string;
  sys?: number | string;
  hr?: number | string;
  cons?: "ALERT" | "VOICE" | "PAIN" | "UNRESPONSIVE" | string;
};

function asNumber(value: number | string | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function newsParam(name: keyof NewsInput, value: number | string | undefined): number {
  const x = asNumber(value);
  if (x === undefined && name !== "cons") return 0;
  if (name === "resp") {
    if (x !== undefined && x <= 8) return 3;
    if (x !== undefined && x <= 11) return 1;
    if (x !== undefined && x <= 20) return 0;
    if (x !== undefined && x <= 24) return 2;
    return 3;
  }
  if (name === "spo2") {
    if (x !== undefined && x >= 96) return 0;
    if (x !== undefined && x >= 94) return 1;
    if (x !== undefined && x >= 92) return 2;
    return 3;
  }
  if (name === "temp") {
    if (x !== undefined && x <= 35.0) return 3;
    if (x !== undefined && x <= 36.0) return 1;
    if (x !== undefined && x <= 38.0) return 0;
    if (x !== undefined && x <= 39.0) return 1;
    return 2;
  }
  if (name === "sys") {
    if (x !== undefined && x <= 90) return 3;
    if (x !== undefined && x <= 100) return 2;
    if (x !== undefined && x <= 110) return 1;
    if (x !== undefined && x <= 219) return 0;
    return 3;
  }
  if (name === "hr") {
    if (x !== undefined && x <= 40) return 3;
    if (x !== undefined && x <= 50) return 1;
    if (x !== undefined && x <= 90) return 0;
    if (x !== undefined && x <= 110) return 1;
    if (x !== undefined && x <= 130) return 2;
    return 3;
  }
  if (name === "cons") {
    return value === "ALERT" ? 0 : 3;
  }
  return 0;
}

export function computeNEWS(input: NewsInput) {
  const parts = {
    resp: newsParam("resp", input.resp),
    spo2: newsParam("spo2", input.spo2),
    temp: newsParam("temp", input.temp),
    sys: newsParam("sys", input.sys),
    hr: newsParam("hr", input.hr),
    cons: newsParam("cons", input.cons)
  };
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  return { total, parts };
}
