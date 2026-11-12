/**
 * utils/powerScalingDict.js
 * Diccionario canónico de Power-Scaling basado en los sistemas oficiales de
 * VSBattles Wiki y Character Stats and Profiles (CSAP).
 *
 * Optimización de rendimiento:
 * Los datos estáticos (~93 KB de definiciones y tiers) se encuentran desacoplados en
 * `/data/power-scaling.json` y se cargan bajo demanda (on-demand) vía `loadPowerScalingData()`,
 * liberando el bundle principal de JavaScript.
 */

export const CANONICAL_TIERS = [];
export const OVERALL_TIER_OPTIONS = [];
export const AP_OPTIONS = [];
export const DC_OPTIONS = [];
export const STRIKING_STRENGTH_OPTIONS = [];
export const DURABILITY_OPTIONS = [];
export const SPEED_OPTIONS = [];
export const LIFTING_STRENGTH_OPTIONS = [];
export const RANGE_OPTIONS = [];
export const IQ_OPTIONS = [];
export const BIQ_OPTIONS = [];
export const INTELLIGENCE_OPTIONS = [];
export const STAMINA_OPTIONS = [];
export const RESISTANCE_PRESETS = [];
export const POWER_SCALING_LABELS = {};
export const POWER_SCALING_DICT = {};

let _cachedData = null;
let _loadPromise = null;

/**
 * Carga los datos de power scaling desde `/data/power-scaling.json`
 * de forma asíncrona y pobla las estructuras exportadas para retrocompatibilidad.
 * @returns {Promise<Object>}
 */
export async function loadPowerScalingData() {
  if (_cachedData) return _cachedData;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      const response = await fetch('/data/power-scaling.json');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      _cachedData = data;

      // Población de estructuras exportadas para preservar compatibilidad por referencia
      if (Array.isArray(data.CANONICAL_TIERS)) {
        CANONICAL_TIERS.splice(0, CANONICAL_TIERS.length, ...data.CANONICAL_TIERS);
      }
      if (Array.isArray(data.OVERALL_TIER_OPTIONS)) {
        OVERALL_TIER_OPTIONS.splice(0, OVERALL_TIER_OPTIONS.length, ...data.OVERALL_TIER_OPTIONS);
      }
      if (Array.isArray(data.AP_OPTIONS)) {
        AP_OPTIONS.splice(0, AP_OPTIONS.length, ...data.AP_OPTIONS);
      }
      if (Array.isArray(data.DC_OPTIONS)) {
        DC_OPTIONS.splice(0, DC_OPTIONS.length, ...data.DC_OPTIONS);
      }
      if (Array.isArray(data.STRIKING_STRENGTH_OPTIONS)) {
        STRIKING_STRENGTH_OPTIONS.splice(0, STRIKING_STRENGTH_OPTIONS.length, ...data.STRIKING_STRENGTH_OPTIONS);
      }
      if (Array.isArray(data.DURABILITY_OPTIONS)) {
        DURABILITY_OPTIONS.splice(0, DURABILITY_OPTIONS.length, ...data.DURABILITY_OPTIONS);
      }
      if (Array.isArray(data.SPEED_OPTIONS)) {
        SPEED_OPTIONS.splice(0, SPEED_OPTIONS.length, ...data.SPEED_OPTIONS);
      }
      if (Array.isArray(data.LIFTING_STRENGTH_OPTIONS)) {
        LIFTING_STRENGTH_OPTIONS.splice(0, LIFTING_STRENGTH_OPTIONS.length, ...data.LIFTING_STRENGTH_OPTIONS);
      }
      if (Array.isArray(data.RANGE_OPTIONS)) {
        RANGE_OPTIONS.splice(0, RANGE_OPTIONS.length, ...data.RANGE_OPTIONS);
      }
      if (Array.isArray(data.IQ_OPTIONS)) {
        IQ_OPTIONS.splice(0, IQ_OPTIONS.length, ...data.IQ_OPTIONS);
      }
      if (Array.isArray(data.BIQ_OPTIONS)) {
        BIQ_OPTIONS.splice(0, BIQ_OPTIONS.length, ...data.BIQ_OPTIONS);
      }
      if (Array.isArray(data.INTELLIGENCE_OPTIONS)) {
        INTELLIGENCE_OPTIONS.splice(0, INTELLIGENCE_OPTIONS.length, ...data.INTELLIGENCE_OPTIONS);
      }
      if (Array.isArray(data.STAMINA_OPTIONS)) {
        STAMINA_OPTIONS.splice(0, STAMINA_OPTIONS.length, ...data.STAMINA_OPTIONS);
      }
      if (Array.isArray(data.RESISTANCE_PRESETS)) {
        RESISTANCE_PRESETS.splice(0, RESISTANCE_PRESETS.length, ...data.RESISTANCE_PRESETS);
      }
      if (data.POWER_SCALING_LABELS) {
        Object.assign(POWER_SCALING_LABELS, data.POWER_SCALING_LABELS);
      }
      if (data.POWER_SCALING_DICT) {
        Object.assign(POWER_SCALING_DICT, data.POWER_SCALING_DICT);
      }

      return data;
    } catch (err) {
      console.warn('[powerScalingDict] No se pudo cargar el diccionario de power-scaling:', err);
      return null;
    } finally {
      _loadPromise = null;
    }
  })();

  return _loadPromise;
}

export default {
  loadPowerScalingData,
  CANONICAL_TIERS,
  OVERALL_TIER_OPTIONS,
  AP_OPTIONS,
  DC_OPTIONS,
  STRIKING_STRENGTH_OPTIONS,
  DURABILITY_OPTIONS,
  SPEED_OPTIONS,
  LIFTING_STRENGTH_OPTIONS,
  RANGE_OPTIONS,
  IQ_OPTIONS,
  BIQ_OPTIONS,
  INTELLIGENCE_OPTIONS,
  STAMINA_OPTIONS,
  RESISTANCE_PRESETS,
  POWER_SCALING_LABELS,
  POWER_SCALING_DICT,
};
