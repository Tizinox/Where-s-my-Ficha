/**
 * utils/unitConverter.js
 * Conversión bidireccional entre Sistema Métrico (m / kg) e Imperial (ft / lbs).
 */

export function convertHeight(val, toSystem) {
  if (!val || typeof val !== 'string') return val;
  const cleaned = val.trim().toLowerCase();
  if (!cleaned) return val;

  if (toSystem === 'imperial') {
    // Si ya contiene feet/inches, mantener
    if (cleaned.includes("'") || cleaned.includes("ft") || cleaned.includes("in")) return val;

    let meters = parseFloat(cleaned.replace(',', '.'));
    if (cleaned.includes('cm')) meters = meters / 100;
    if (!isNaN(meters) && meters > 0 && meters < 5) {
      const totalInches = Math.round(meters * 39.3701);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}'${inches}"`;
    }
  } else if (toSystem === 'metric') {
    // Si ya contiene m o cm, mantener
    if (cleaned.includes('m') || cleaned.includes('cm')) return val;

    const match = cleaned.match(/(\d+)\s*(?:'|ft|pies)?\s*(\d+)?\s*(?:"|in|pulgadas)?/);
    if (match) {
      const feet = parseInt(match[1], 10);
      const inches = match[2] ? parseInt(match[2], 10) : 0;
      if (!isNaN(feet) && feet > 0 && feet < 15) {
        const totalInches = (feet * 12) + inches;
        const meters = (totalInches * 0.0254).toFixed(2);
        return `${meters} m`;
      }
    }
  }
  return val;
}

export function convertWeight(val, toSystem) {
  if (!val || typeof val !== 'string') return val;
  const cleaned = val.trim().toLowerCase();
  if (!cleaned) return val;

  if (toSystem === 'imperial') {
    if (cleaned.includes('lb') || cleaned.includes('lbs')) return val;
    const kg = parseFloat(cleaned.replace(',', '.'));
    if (!isNaN(kg) && kg > 0) {
      const lbs = Math.round(kg * 2.20462);
      return `${lbs} lbs`;
    }
  } else if (toSystem === 'metric') {
    if (cleaned.includes('kg')) return val;
    const lbs = parseFloat(cleaned.replace(',', '.'));
    if (!isNaN(lbs) && lbs > 0) {
      const kg = Math.round(lbs / 2.20462);
      return `${kg} kg`;
    }
  }
  return val;
}
