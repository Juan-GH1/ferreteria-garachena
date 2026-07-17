/** Valida un RUT chileno: formato + dígito verificador (módulo 11). */
export function isValidRut(rutRaw) {
  const rut = String(rutRaw || '').replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;

  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDv = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === expectedDv;
}
