/**
 * Generates a random 6-digit PIN string (100000-999999).
 */
export function generatePin(): string {
  const pin = Math.floor(100000 + Math.random() * 900000);
  return pin.toString();
}

/**
 * Generates a unique 6-digit PIN that does not exist in the provided set.
 * Keeps generating until a unique PIN is found.
 */
export function generateUniquePin(existingPins: Set<string>): string {
  let pin = generatePin();
  while (existingPins.has(pin)) {
    pin = generatePin();
  }
  return pin;
}
