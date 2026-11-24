/** Translate only known generic city labels; preserve custom/legal addresses verbatim. */
export function contactAddress(address: string, localizedFallback: string) {
  const generic = ["Ладижин, Вінницька обл.", "м. Ладижин, Вінницька область", "Ladyzhyn, Vinnytsia region"];
  return !address.trim() || generic.includes(address.trim()) ? localizedFallback : address;
}
