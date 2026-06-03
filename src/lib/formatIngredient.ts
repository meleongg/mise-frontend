/**
 * Turn structured ingredient { name, measure } into readable list text.
 */

const TO_TASTE = /^to\s*taste$/i;

function cleanMeasure(measure: string): string {
  let amount = measure.trim().replace(/\s+/g, " ").replace(/,\s*$/, "");
  const qtyCommaPrep = amount.match(/^(\d+)\s*,\s+(.+)$/);
  if (qtyCommaPrep) {
    amount = `${qtyCommaPrep[1]} ${qtyCommaPrep[2]}`;
  }
  return amount;
}

/**
 * @example formatIngredientDisplay("Salt", "to taste") → "Salt, to taste"
 * @example formatIngredientDisplay("bell pepper", "1, sliced") → "1 sliced bell pepper"
 */
export function formatIngredientDisplay(
  name: string,
  measure?: string
): string {
  const ingredientName = (name ?? "").trim();
  let amount = cleanMeasure(measure ?? "");

  if (!ingredientName && !amount) return "";
  if (!amount) return ingredientName;
  if (!ingredientName) return amount;

  if (TO_TASTE.test(amount)) {
    return `${ingredientName}, to taste`;
  }

  // Stray comma after a lone quantity (e.g. measure "1," + name "sliced bell pepper")
  amount = amount.replace(/^(\d+)\s*,\s*$/, "$1");

  return `${amount} ${ingredientName}`.replace(/\s+/g, " ").trim();
}
