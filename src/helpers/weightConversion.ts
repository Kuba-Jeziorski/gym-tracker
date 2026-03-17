/** Factor for kg → lb (1 kg = 2.2 lb). We store weights in kg and convert for display/input. */
export const KG_TO_LB = 2.2;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

/** Stored value is in kg. Returns string for display in the given unit. */
export function formatStoredWeightForDisplay(kgValue: string, unit: "kg" | "lb"): string {
  const trimmed = kgValue?.trim();
  if (!trimmed) return "—";
  const kg = parseFloat(trimmed);
  if (Number.isNaN(kg)) return trimmed;
  if (unit === "lb") {
    const lb = kgToLb(kg);
    return lb % 1 === 0 ? lb.toString() : lb.toFixed(1);
  }
  return trimmed;
}

/** User input in display unit → string kg for storage. */
export function inputWeightToKg(value: string, unit: "kg" | "lb"): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return trimmed;
  if (unit === "lb") {
    const kg = lbToKg(num);
    return kg % 1 === 0 ? kg.toString() : kg.toFixed(2);
  }
  return trimmed;
}

/** Stored kg → string for form display in the given unit. */
export function storedKgToDisplay(kgValue: string, unit: "kg" | "lb"): string {
  const trimmed = kgValue?.trim();
  if (!trimmed) return "";
  const kg = parseFloat(trimmed);
  if (Number.isNaN(kg)) return trimmed;
  if (unit === "lb") {
    const lb = kgToLb(kg);
    return lb % 1 === 0 ? lb.toString() : lb.toFixed(1);
  }
  return trimmed;
}
