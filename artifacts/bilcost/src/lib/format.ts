export function formatDkk(value: number): string {
  return `${Math.round(value).toLocaleString("da-DK")} kr`;
}

export function formatDkkShort(value: number): string {
  const v = Math.round(value);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mio. kr`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 1_000)}.000 kr`;
  return `${v.toLocaleString("da-DK")} kr`;
}

export function formatKm(value: number): string {
  return `${Math.round(value).toLocaleString("da-DK")} km`;
}

export function fuelLabel(fuel: string): string {
  switch (fuel) {
    case "petrol":
      return "Benzin";
    case "diesel":
      return "Diesel";
    case "hybrid":
      return "Hybrid";
    case "phev":
      return "Plug-in hybrid";
    case "electric":
      return "El";
    default:
      return fuel;
  }
}

export function transmissionLabel(t: string): string {
  switch (t) {
    case "manual":
      return "Manuel";
    case "automatic":
      return "Automat";
    default:
      return "Ukendt";
  }
}
