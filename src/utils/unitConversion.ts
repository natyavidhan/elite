export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

export function kmToMiles(km: number): number {
  return km * 0.621371;
}

export function milesToKm(miles: number): number {
  return miles / 0.621371;
}

export function formatWeight(kg: number, unit: 'kg' | 'lbs'): string {
  const value = unit === 'kg' ? kg : kgToLbs(kg);
  return `${value.toFixed(1)} ${unit}`;
}

export function formatDistance(km: number, system: 'metric' | 'imperial'): string {
  const value = system === 'metric' ? km : kmToMiles(km);
  const unit = system === 'metric' ? 'km' : 'mi';
  return `${value.toFixed(2)} ${unit}`;
}
