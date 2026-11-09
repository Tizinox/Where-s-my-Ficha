/**
 * utils/exportEngine.js
 * Motores de exportación: Discord TXT y Backup JSON.
 */

import { sanitizeCorruptedTokens } from './textFormatterEngine.js';

// ═══════════════════════════════════════════════════════════════════
// 1. Discord TXT — convierte la ficha a bloques ≤ 2000 chars con soporte WYSIWYG
// ═══════════════════════════════════════════════════════════════════

export const DISCORD_SEPARATORS = [
  { id: 'thin_line', label: 'Línea Fina Minimalista', value: '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯' },
  { id: 'bold_line', label: 'Línea Gruesa Clásica', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
  { id: 'fantasy_stars', label: 'Estrellas y Fantasía', value: '✦───✦───✦───✦───✦───✦───✦───✦' },
  { id: 'tactical_double', label: 'Doble Línea Táctica', value: '══════════════════════════════════' },
  { id: 'standard_dash', label: 'Guiones Estándar', value: '──────────────────────────────────' },
  { id: 'cyber_blocks', label: 'Cyber / Glitch Matrix', value: '░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒' },
  { id: 'code_block', label: 'Bloque de Código', value: '```' },
];

export const DISCORD_SECTIONS = [
  { id: 'basics', label: 'Datos Básicos', icon: 'id-card' },
  { id: 'body', label: 'Cuerpo y Apariencia', icon: 'activity' },
  { id: 'mind', label: 'Mente y Personalidad', icon: 'brain' },
  { id: 'social', label: 'Social y Relaciones', icon: 'users-round' },
  { id: 'beliefs', label: 'Creencias y Filosofía', icon: 'compass' },
  { id: 'priorities', label: 'Prioridades y Metas', icon: 'list-todo' },
  { id: 'skills', label: 'Habilidades', icon: 'zap' },
  { id: 'weapons', label: 'Arsenal', icon: 'sword' },
  { id: 'power', label: 'Power-Scaling', icon: 'gauge' },
  { id: 'extras', label: 'Extras y Recursos', icon: 'layers' },
];

const DEFAULT_SEP = DISCORD_SEPARATORS[0].value;
const MAX_BLOCK = 1950;

/** Convierte etiquetas HTML enriquecidas a sintaxis nativa de Markdown de Discord */
export function cleanHtmlToDiscord(str) {
  if (!str || typeof str !== 'string') return '';
  const clean = sanitizeCorruptedTokens(str);
  return clean
    .replace(/<(b|strong)[^>]*>(.*?)<\/\1>/gi, '**$2**')
    .replace(/<(i|em)[^>]*>(.*?)<\/\1>/gi, '*$2*')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
    .replace(/<(s|strike|del)[^>]*>(.*?)<\/\1>/gi, '~~$2~~')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/<[^>]+>/g, '');
}

/** Devuelve un campo si tiene valor, o cadena vacía */
const field = (label, value) =>
  value && String(value).trim() ? `**${label}:** ${cleanHtmlToDiscord(String(value))}\n` : '';

/**
 * Genera una plantilla compacta (< 1500 caracteres) que cabe en un solo mensaje de Discord
 */
export function generateCompactDiscordText(char, separator = DEFAULT_SEP) {
  if (!char) return '';
  const b = char.basics || {};
  const bo = char.body || {};
  const m = char.mind || {};
  const be = char.beliefs || {};
  const p = char.priorities || {};
  const sk = Array.isArray(char.skills) ? char.skills : [];
  const wp = Array.isArray(char.weapons) ? char.weapons : [];
  const ps = char.powerScaling || {};

  let txt = '';

  // Portada / Cabecera
  txt += `# 👤 ${b.fullName || char.name || 'Sin Nombre'}\n`;
  if (b.nickname) txt += `*"${b.nickname}"* `;
  const metaPills = [
    b.role,
    b.race,
    b.realAge ? `${b.realAge} años` : null,
    b.alignment && b.alignment !== 'Neutral Absoluto' ? b.alignment : null
  ].filter(Boolean);
  if (metaPills.length > 0) {
    txt += `[ ${metaPills.join(' • ')} ]\n`;
  }
  txt += `\n${separator}\n\n`;

  // Cita destacada
  if (Array.isArray(b.quotes) && b.quotes.length > 0 && b.quotes[0]) {
    txt += `> *“${cleanHtmlToDiscord(String(b.quotes[0]).trim())}”*\n\n`;
  }

  // Biometría y Aspecto
  const bio = [];
  if (bo.height) bio.push(`**Est:** ${bo.height}`);
  if (bo.weight) bio.push(`**Peso:** ${bo.weight}`);
  if (bo.build) bio.push(`**Complexión:** ${bo.build}`);
  if (bo.eyeColor) bio.push(`**Ojos:** ${bo.eyeColor}`);
  if (bo.hairColor) bio.push(`**Cabello:** ${bo.hairColor}`);
  if (bio.length > 0) {
    txt += `📊 **Biometría:** ${bio.join(' | ')}\n`;
  }

  // Mente y Eje Moral
  if (m.personalitySummary) {
    const summary = cleanHtmlToDiscord(m.personalitySummary).trim();
    txt += `🧠 **Personalidad:** ${summary.slice(0, 160)}${summary.length > 160 ? '...' : ''}\n`;
  }
  if (be.moralCode) {
    txt += `⚖️ **Código Moral:** ${cleanHtmlToDiscord(be.moralCode)}\n`;
  }
  if (p.mainGoal) {
    txt += `🎯 **Objetivo Principal:** ${cleanHtmlToDiscord(p.mainGoal)}\n`;
  }

  // Top 3 Habilidades
  if (sk.length > 0) {
    txt += `\n⚡ **Habilidades Clave:**\n`;
    sk.slice(0, 3).forEach((s, idx) => {
      const type = s.type === 'active' ? 'Activa' : 'Pasiva';
      const rank = s.tier ? ` [${s.tier}]` : '';
      const summary = s.summary || s.shortSummary || (s.effect ? s.effect.slice(0, 80) + '...' : 'Sin descripción');
      txt += `• **${s.title || `Habilidad ${idx + 1}`}** (${type}${rank}): ${cleanHtmlToDiscord(summary)}\n`;
    });
  }

  // Arma principal
  if (wp.length > 0 && (wp[0].name || wp[0].weaponType)) {
    const w = wp[0];
    txt += `\n🗡️ **Armamento:** **${w.name || 'Arma Principal'}** (${w.weaponType || 'Equipo'}${w.rarity ? ` • ${w.rarity}` : ''})\n`;
  }

  // Power Scaling Tier
  if (ps.enabled && (ps.overallTier || ps.tier)) {
    const tierDisplay = ps.overallTier || ps.tier;
    const speedDisplay = ps.speedCombat || ps.speed || 'N/A';
    const dcDisplay = ps.dc ? ` | DC: \`${ps.dc}\`` : '';
    txt += `\n🔥 **Power Scaling:** Tier: \`${tierDisplay}\` | AP: \`${ps.tier || tierDisplay}\`${dcDisplay} | Vel: \`${speedDisplay}\` | Dur: \`${ps.durability || 'N/A'}\`\n`;
  }

  txt += `\n-# Generado con ¿Where is my Ficha? RP`;
  return txt.trimEnd();
}

/**
 * Convierte toda la ficha activa a un string de texto Discord-formatted
 * @param {object} char Personaje a exportar
 * @param {object} options Opciones de exportación ({ mode, sections, separator })
 */
export function charToDiscordText(char, options = {}) {
  if (!char) return '';

  const mode = options.mode || 'standard';
  const sep = options.separator || DEFAULT_SEP;
  const sections = Array.isArray(options.sections) && options.sections.length > 0
    ? options.sections
    : DISCORD_SECTIONS.map(s => s.id);

  // Si el modo es compacto, delegar al generador optimizado
  if (mode === 'compact') {
    return generateCompactDiscordText(char, sep);
  }

  const b = char.basics || {};
  const bo = char.body || {};
  const m = char.mind || {};
  const s = char.social || {};
  const be = char.beliefs || {};
  const p = char.priorities || {};
  const sk = Array.isArray(char.skills) ? char.skills : [];
  const ps = char.powerScaling || {};
  const ex = char.extras || {};

  let txt = '';

  // ── PORTADA ──────────────────────────────────────────────────────
  txt += `# 🎭 **${b.fullName || char.name}**\n`;
  if (b.nickname) txt += `*"${b.nickname}"*\n`;
  if (b.alignment) txt += `_${b.alignment}_\n`;
  txt += `\n${sep}\n\n`;

  // ── DATOS BÁSICOS ─────────────────────────────────────────────────
  if (sections.includes('basics')) {
    txt += `## 📋 **DATOS BÁSICOS**\n`;
    txt += field('Nombre completo', b.fullName);
    txt += field('Apodo / Alias / Títulos', b.nickname);
    txt += field('Edad real', b.realAge);
    txt += field('Edad aparente', b.apparentAge);
    txt += field('Género / Pronombres', b.genderPronouns);
    txt += field('Raza / Especie', b.race);
    txt += field('Orientación', b.orientation);
    txt += field('Ocupación / Rol', b.role);
    txt += field('Clase / Arquetipo RPG', ex.class || ex.charClass);
    txt += field('Arquetipo / Estilo FGC', ex.fgcStyle);
    txt += field('Alineamiento', b.alignment);
    if (Array.isArray(b.quotes) && b.quotes.length > 0) {
      txt += `**Frases Célebres / Citas:**\n`;
      b.quotes.forEach(q => {
        if (q && String(q).trim()) {
          txt += `• _“${cleanHtmlToDiscord(String(q).trim())}”_\n`;
        }
      });
    }
    txt += `\n${sep}\n\n`;
  }

  // ── CUERPO y BIOMETRÍA ───────────────────────────────────────────
  if (sections.includes('body')) {
    let bodyTxt = '';
    bodyTxt += field('Estatura', bo.height);
    bodyTxt += field('Peso', bo.weight);
    bodyTxt += field('Complexión / Constitución', bo.build);
    if (!bo.height && !bo.weight && !bo.build && bo.heightWeight) {
      bodyTxt += field('Estatura y peso', bo.heightWeight);
    }
    bodyTxt += field('Color de Ojos', bo.eyeColor);
    bodyTxt += field('Color / Tipo de Cabello', bo.hairColor);
    bodyTxt += field('Tono de Piel', bo.skinColor);
    bodyTxt += field('Postura y Lenguaje Corporal', bo.postureBodyLanguage);
    bodyTxt += field('Expresión Facial Habitual', bo.facialExpression);
    bodyTxt += field('Voz y Registro Vocal', bo.voice);
    bodyTxt += field('Olor / Aroma Característico', bo.scentAroma);
    bodyTxt += field('Rasgos Fisiológicos Distintivos / Fenotipo', bo.speciesPhenotype);
    bodyTxt += field('Condición Física y Salud Crónica', bo.physicalCondition);
    bodyTxt += field('Presencia e Impacto Visual (Aura)', bo.presenceAura);
    bodyTxt += field('Accesorios Cotidianos / Objetos Visibles', bo.notableAccessories);
    bodyTxt += field('Modificaciones Corporales y Alteraciones', bo.bodyModifications);
    if (bo.distinctiveMarks && !bo.bodyModifications) {
      bodyTxt += field('Marcas distintivas', bo.distinctiveMarks);
    }
    bodyTxt += field('Estilo de vestir / Indumentaria', bo.clothingStyle);
    if (bo.physicalDescription && String(bo.physicalDescription).trim()) {
      bodyTxt += `**Descripción física:**\n${String(bo.physicalDescription).trim()}\n`;
    }

    if (bodyTxt.trim()) {
      txt += `## 🧬 **CUERPO Y APARIENCIA**\n`;
      txt += bodyTxt;
      txt += `\n${sep}\n\n`;
    }
  }

  // ── MENTE ────────────────────────────────────────────────────────
  if (sections.includes('mind')) {
    txt += `## 🧠 **MENTE Y PERSONALIDAD**\n`;
    if (m.personalitySummary) txt += `**Personalidad:**\n${cleanHtmlToDiscord(m.personalitySummary)}\n`;
    txt += field('MBTI / Arquetipo', m.mbti);
    txt += field('Estado de sanidad / Estabilidad emocional', m.sanityStatus);
    if (m.sanityNotes) txt += `**Notas de sanidad:**\n${cleanHtmlToDiscord(m.sanityNotes)}\n`;
    txt += field('Anclaje de cordura / Refugio emocional', m.sanityAnchor || p.sanityAnchor);
    if (m.virtues) txt += `**Virtudes:**\n${cleanHtmlToDiscord(m.virtues)}\n`;
    if (m.flaws) txt += `**Defectos:**\n${cleanHtmlToDiscord(m.flaws)}\n`;
    if (m.fobiasTraumas) txt += `**Fobias y traumas:**\n${cleanHtmlToDiscord(m.fobiasTraumas)}\n`;
    if (m.triggers) txt += `**Desencadenantes (Triggers):**\n${cleanHtmlToDiscord(m.triggers)}\n`;
    if (m.defenseMechanisms) txt += `**Mecanismos de defensa / Respuesta al estrés:**\n${cleanHtmlToDiscord(m.defenseMechanisms)}\n`;
    if (m.habitsCompulsions) txt += `**Manías, tics y hábitos compulsivos:**\n${cleanHtmlToDiscord(m.habitsCompulsions)}\n`;

    if (Array.isArray(m.axes) && m.axes.length > 0) {
      txt += `\n**Ejes de Personalidad (Espectro Bipolar):**\n`;
      m.axes.forEach(a => {
        if (a.leftLabel || a.rightLabel) {
          const cat = a.category ? ` [${a.category}]` : '';
          const leftPct = 100 - (a.value ?? 50);
          const rightPct = a.value ?? 50;
          txt += `• [${leftPct}%] ${a.leftLabel || 'Polo A'} ◄──●──► ${a.rightLabel || 'Polo B'} [${rightPct}%]${cat}\n`;
        }
      });
    }
    txt += `\n${sep}\n\n`;
  }

  // ── SOCIAL ───────────────────────────────────────────────────────
  if (sections.includes('social')) {
    txt += `## 👥 **ENTORNO SOCIAL y RELACIONES**\n`;
    txt += field('Facción / Bando principal', s.faction);
    txt += field('Estatus / Reputación general', s.reputation);
    txt += field('Máscara social / Identidad pública vs. Real', s.socialMask);
    txt += field('Estilo de vida y estándar', s.lifestyleStandard);
    txt += field('Origen / Residencia actual', s.originResidencia);
    txt += field('Estilo de comunicación y persuasión', s.communicationStyle);
    txt += field('Rumores y percepción pública', s.rumorsPublicView);
    txt += field('Deudas y favores pendientes', s.debtsFavors);
    txt += field('Enemigos y rivales declarados', s.rivalsEnemies);
    txt += field('Dependientes y personas a cargo', s.dependents);
    txt += field('Idiomas y dialectos', s.languages);

    const rels = Array.isArray(s.relations) ? s.relations : [];
    if (rels.length > 0) {
      txt += `\n**Relaciones y Vínculos:**\n`;
      rels.forEach(r => {
        if (r.name) {
          const bond = r.bondType || r.bond;
          txt += `• **${r.name}**${bond ? ` [_${bond}_]` : ''}${r.status ? ` — ${r.status}` : ''}\n`;
          if (r.description) txt += `  ${cleanHtmlToDiscord(r.description)}\n`;
        }
      });
    }

    const facs = Array.isArray(s.factions) ? s.factions : [];
    if (facs.length > 0) {
      txt += `\n**Facciones y Afinidad:**\n`;
      facs.forEach(f => {
        if (f.name) {
          txt += `• **${f.name}**: ${f.affinity || 'Neutral'}\n`;
        }
      });
    }

    if (s.networkInfluence) {
      txt += `\n**Red de Contactos, Informantes e Influencia:**\n${cleanHtmlToDiscord(s.networkInfluence)}\n`;
    }
    txt += `\n${sep}\n\n`;
  }

  // ── CREENCIAS ────────────────────────────────────────────────────
  if (sections.includes('beliefs')) {
    txt += `## 🕯️ **CREENCIAS Y FILOSOFÍA DE VIDA**\n`;
    txt += field('Código moral / Filosofía', be.moralCode);
    txt += field('Religión / Fe / Dogma', be.religion);
    txt += field('Visión del mundo', be.worldview);
    txt += field('Autoimagen / Creencia sobre sí mismo', be.selfImage);
    txt += field('Origen / Evento detonante', be.originEvent);
    txt += field('Actitud ante la autoridad', be.authorityStance);
    txt += field('Creencia declarada vs. Activa', be.statedVsActive);
    txt += field('Contradicciones y puntos ciegos', be.blindSpots);
    txt += field('Prejuicios y sesgos', be.biasesPrejudices);
    txt += field('Lo que ama / valora', be.loves);
    txt += field('Lo que odia / detesta', be.hates);
    txt += field('Línea roja infranqueable / Precio inaceptable', be.redLine);
    txt += field('Supersticiones / Creencias menores', be.superstitions);
    txt += `\n${sep}\n\n`;
  }

  // ── PRIORIDADES ──────────────────────────────────────────────────
  if (sections.includes('priorities')) {
    txt += `## 🎯 **PRIORIDADES, METAS y EJE MORAL**\n`;
    txt += field('Objetivo principal', p.mainGoal);
    txt += field('Deseo vs. Necesidad (Want vs. Need)', p.wantVsNeed);
    txt += field('Horizonte temporal y urgencia', p.timeHorizonUrgency);
    txt += field('Fantasía de victoria / Recompensa esperada', p.victoryFantasy);
    txt += field('Motivación profunda / Fuerza impulsora', p.deepMotivation);
    txt += field('Mayor temor', p.greatestFear);
    txt += field('Conflicto actual / Dilema activo', p.currentConflict);
    txt += field('Línea de sacrificio', p.sacrificeLine);
    txt += field('Lealtad máxima', p.maxLoyalty);
    txt += field('Escala de jerarquía en conflicto', p.conflictHierarchy);
    txt += field('Reacción al fracaso / Contingencia', p.failureReaction);

    const secGoals = Array.isArray(p.secondaryGoals) ? p.secondaryGoals : [];
    if (secGoals.length > 0) {
      txt += `\n**Objetivos Secundarios:**\n`;
      secGoals.forEach(g => {
        if (g.text) {
          const statusMap = {
            in_progress: '⚙️ En Curso',
            completed: '✓ Cumplido',
            pending: '⏳ Pendiente',
            abandoned: '✕ Descartado'
          };
          const statusLabel = statusMap[g.status] || g.status || 'Pendiente';
          txt += `• [${statusLabel}] ${cleanHtmlToDiscord(g.text)}\n`;
        }
      });
    }
    txt += `\n${sep}\n\n`;
  }

  // ── HABILIDADES ──────────────────────────────────────────────────
  if (sections.includes('skills') && sk.length > 0) {
    txt += `## ⚡ **HABILIDADES**\n`;
    sk.forEach((skill, i) => {
      const typeLabel = skill.type === 'active' ? ' Activa' : ' Pasiva';
      txt += `\n**${i + 1}. ${skill.title || 'Sin título'}** [${typeLabel}]\n`;
      if (skill.summary && String(skill.summary).trim()) {
        txt += `_${cleanHtmlToDiscord(skill.summary.trim())}_\n`;
      }
      if (skill.tier && String(skill.tier).trim()) {
        txt += `• Rango: ${skill.tier.trim()}\n`;
      }
      if (skill.elementType && String(skill.elementType).trim()) {
        txt += `• Elemento/Daño: ${skill.elementType.trim()}\n`;
      }
      if (skill.range && String(skill.range).trim()) {
        txt += `• Alcance: ${skill.range.trim()}\n`;
      }
      if (Array.isArray(skill.tags) && skill.tags.length > 0) {
        txt += `• Tags: ${skill.tags.join(', ')}\n`;
      }
      if (skill.effect) txt += `${cleanHtmlToDiscord(skill.effect)}\n`;
      if (skill.type === 'active') {
        if (skill.td) txt += `• TD: ${skill.td}\n`;
        if (skill.cd) txt += `• CD: ${skill.cd}\n`;
        if (skill.cost) txt += `• Coste: ${skill.cost}\n`;
      } else {
        txt += `• Duración: Permanente\n`;
        if (skill.condicion) txt += `• Activación: ${skill.condicion}\n`;
      }
      if (skill.drawback && String(skill.drawback).trim()) {
        txt += `⚠️ **Repercusión:** ${cleanHtmlToDiscord(skill.drawback.trim())}\n`;
      }
    });
    txt += `\n${sep}\n\n`;
  }

  // ── ARMAS Y ARTEFACTOS ──────────────────────────────────────────
  if (sections.includes('weapons')) {
    const wp = Array.isArray(char.weapons) ? char.weapons : [];
    if (wp.length > 0) {
      txt += `## 🗡️ **ARMAS Y ARTEFACTOS**\n`;
      wp.forEach((w, i) => {
        if (!w.name && !w.weaponType) return;
        txt += `\n**${i + 1}. ${w.name || 'Sin nombre'}**`;
        if (w.rarity) txt += `  _${w.rarity}_`;
        if (w.weaponType) txt += ` [${w.weaponType}]`;
        txt += '\n';
        if (Array.isArray(w.tags) && w.tags.length > 0) {
          txt += `• Tags: ${w.tags.map(t => '#' + t).join(' ')}\n`;
        }
        if (w.damage) txt += `• Daño / Efecto: ${cleanHtmlToDiscord(w.damage)}\n`;
        if (w.range) txt += `• Alcance / Área: ${cleanHtmlToDiscord(w.range)}\n`;
        if (w.cd) txt += `• CD: ${w.cd}\n`;
        if (w.td) txt += `• TD / Duración: ${w.td}\n`;

        const linkedSkill = w.linkedSkillId ? (char.skills || []).find(s => s.id === w.linkedSkillId) : null;
        if (linkedSkill) {
          txt += `• **Habilidad Vinculada:** ${linkedSkill.title || 'Habilidad sin nombre'} (${linkedSkill.type === 'active' ? 'Activa' : 'Pasiva'})\n`;
        } else if (w.skillName) {
          txt += `• **Habilidad:** ${cleanHtmlToDiscord(w.skillName)}\n`;
        }
        if (w.properties) txt += `• Propiedades: ${cleanHtmlToDiscord(w.properties)}\n`;
        if (w.lore) txt += `📜 ${cleanHtmlToDiscord(w.lore)}\n`;
      });
      txt += `\n${sep}\n\n`;
    }
  }

  // ── POWER-SCALING ────────────────────────────────────────────────
  if (sections.includes('power') && ps.enabled) {
    txt += `## 🔥 **POWER-SCALING y TELEMETRÍA DE COMBATE**\n`;

    if (ps.overallTier) txt += field('Nivel Global / Overall Rating', ps.overallTierCustom ? `${ps.overallTier} (${ps.overallTierCustom})` : ps.overallTier);
    if (ps.tier) txt += field('Potencia de Ataque (AP)', ps.tierCustom ? `${ps.tier} (${ps.tierCustom})` : ps.tier);
    if (ps.dc) txt += field('Capacidad de Destrucción (DC)', ps.dcCustom ? `${ps.dc} (${ps.dcCustom})` : ps.dc);
    if (ps.strikingStrength) txt += field('Fuerza de Impacto (Striking Strength)', ps.strikingStrengthCustom ? `${ps.strikingStrength} (${ps.strikingStrengthCustom})` : ps.strikingStrength);
    if (ps.durability) txt += field('Durabilidad / Resistencia Física', ps.durabilityCustom ? `${ps.durability} (${ps.durabilityCustom})` : ps.durability);

    // Velocidades
    if (ps.speed) txt += field('Velocidad General', ps.speedCustom ? `${ps.speed} (${ps.speedCustom})` : ps.speed);
    if (ps.speedTravel) txt += field('• Velocidad de Desplazamiento', ps.speedTravelCustom ? `${ps.speedTravel} (${ps.speedTravelCustom})` : ps.speedTravel);
    if (ps.speedCombat) txt += field('• Velocidad de Combate', ps.speedCombatCustom ? `${ps.speedCombat} (${ps.speedCombatCustom})` : ps.speedCombat);
    if (ps.speedReaction) txt += field('• Velocidad de Reacción', ps.speedReactionCustom ? `${ps.speedReaction} (${ps.speedReactionCustom})` : ps.speedReaction);
    if (ps.speedAttack) txt += field('• Velocidad de Ataque', ps.speedAttackCustom ? `${ps.speedAttack} (${ps.speedAttackCustom})` : ps.speedAttack);

    if (ps.liftingStrength) txt += field('Fuerza de Levantamiento', ps.liftingStrengthCustom ? `${ps.liftingStrength} (${ps.liftingStrengthCustom})` : ps.liftingStrength);
    if (ps.range) txt += field('Alcance (Range)', ps.rangeCustom ? `${ps.range} (${ps.rangeCustom})` : ps.range);
    if (ps.iq || ps.intelligence) txt += field('IQ (Inteligencia General)', ps.iqCustom ? `${ps.iq || ps.intelligence} (${ps.iqCustom})` : (ps.iq || ps.intelligence));
    if (ps.biq) txt += field('BIQ (Inteligencia de Combate)', ps.biqCustom ? `${ps.biq} (${ps.biqCustom})` : ps.biq);
    if (ps.stamina) txt += field('Stamina (Resistencia Energética)', ps.staminaCustom ? `${ps.stamina} (${ps.staminaCustom})` : ps.stamina);

    // Resistencias
    const resList = Array.isArray(ps.resistancesList) ? ps.resistancesList : [];
    if (resList.length > 0 || (ps.resistancesNotes && ps.resistancesNotes.trim())) {
      txt += `\n🛡️ **Matriz de Resistencias e Inmunidades:**\n`;
      if (resList.length > 0) {
        txt += `• **Resistencias:** ${resList.join(' • ')}\n`;
      }
      if (ps.resistancesNotes && ps.resistancesNotes.trim()) {
        txt += `• **Detalles:** ${cleanHtmlToDiscord(ps.resistancesNotes.trim())}\n`;
      }
    }

    // Hax y Habilidades Especiales
    const haxList = Array.isArray(ps.haxList) ? ps.haxList : [];
    if (haxList.length > 0) {
      txt += `\n✨ **Hax y Capacidades Especiales:** ${haxList.join(' • ')}\n`;
    }

    // Debilidades Críticas
    if (ps.weaknesses) txt += `\n⚠️ **Debilidades Críticas:**\n${cleanHtmlToDiscord(ps.weaknesses)}\n`;

    txt += '\n';

    // Feats Log con Auditoría
    if (Array.isArray(ps.feats) && ps.feats.length > 0) {
      txt += `**Hazañas (Feat Log con Auditoría):**\n`;
      ps.feats.forEach(f => {
        const auditIcon = f.auditState === 'outlier' ? ' [OUTLIER]' : f.auditState === 'anti-feat' ? ' [ANTI-FEAT]' : ' [CONSISTENTE]';
        txt += `• ${auditIcon} **${f.title || 'Hazaña sin nombre'}**`;
        if (f.targetStat) txt += ` [${f.targetStat}]`;
        if (f.tier) txt += ` ⟪ ${f.tier} ⟫`;
        txt += `\n`;
        if (f.context) txt += `  _${cleanHtmlToDiscord(String(f.context).trim())}_\n`;
        if (f.link) txt += `  🔗 ${f.link}\n`;
        txt += '\n';
      });
    }

    txt += `${sep}\n\n`;
  }

  // ── EXTRAS ───────────────────────────────────────────────────────
  if (sections.includes('extras')) {
    const rpgClassName = ex.class || ex.charClass;
    const rpgClassDesc = ex.charClassCustomDesc;
    const fgcStyleName = ex.fgcStyle;
    const fgcStyleDesc = ex.fgcStyleCustomDesc;
    const hasExtras = rpgClassName || fgcStyleName || ex.voiceActor || ex.voiceUrl || ex.curiosities || ex.playlist || ex.secondaryLikes || ex.roleNotes || ex.conceptInspirations || ex.narrativeRoleTropes || ex.sentimentalItems || ex.aestheticMoodboard || ex.rpDynamicsShips || ex.dialogueFormattingStyle;
    if (hasExtras) {
      txt += `## 📦 **EXTRAS, INSPIRACIÓN y RECURSOS NARRATIVOS**\n`;
      if (rpgClassName) {
        txt += field('Clase RPG', rpgClassName);
        if (rpgClassDesc) {
          txt += `• Descripción de Clase: ${cleanHtmlToDiscord(rpgClassDesc)}\n`;
        }
      }
      if (fgcStyleName) {
        txt += field('Arquetipo de Combate (FGC)', fgcStyleName);
        if (fgcStyleDesc) {
          txt += `• Telemetría FGC: ${cleanHtmlToDiscord(fgcStyleDesc)}\n`;
        }
      }
      txt += field('Fuentes de Inspiración / Concepto', ex.conceptInspirations);
      txt += field('Rol Narrativo / Tropo', ex.narrativeRoleTropes);
      txt += field('Objetos Sentimentales / Reliquias', ex.sentimentalItems);
      txt += field('Aesthetic / Paleta HEX / Moodboard', ex.aestheticMoodboard);
      txt += field('Dinámicas de Rol / Ships (RP)', ex.rpDynamicsShips);
      txt += field('Estilo de Diálogo / Formato de Texto', ex.dialogueFormattingStyle);
      txt += field('Actor de voz / Seiyuu', ex.voiceActor);
      txt += field('Referencia de voz', ex.voiceUrl);
      if (ex.curiosities) txt += `**Curiosidades:**\n${cleanHtmlToDiscord(ex.curiosities)}\n`;
      if (ex.playlist) txt += `**Playlist:**\n${cleanHtmlToDiscord(ex.playlist)}\n`;
      if (ex.secondaryLikes) txt += `**Gustos secundarios:**\n${cleanHtmlToDiscord(ex.secondaryLikes)}\n`;
      if (ex.roleNotes) txt += `**Notas de rol:**\n${cleanHtmlToDiscord(ex.roleNotes)}\n`;
    }
  }

  return txt.trimEnd();
}

/**
 * Transforma la sintaxis de Markdown nativa de Discord en HTML estilizado para el simulador WYSIWYG
 * @param {string} markdownText Texto en formato Discord Markdown
 * @returns {string} HTML renderizado
 */
export function parseDiscordMarkdownToHtml(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') return '';

  // 1. Escapar caracteres HTML básicos para seguridad
  let html = markdownText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Bloques de código (```lang\ncode\n```)
  html = html.replace(/```([a-z0-9_-]*)\n?([\s\S]*?)```/gi, (match, lang, code) => {
    return `<pre class="my-2 p-3 bg-[#1e1f22] border border-[#2b2d31] rounded-md font-mono text-xs text-[#dbdee1] overflow-x-auto whitespace-pre leading-relaxed"><code>${code.trim()}</code></pre>`;
  });

  // 3. Encabezados (#, ##, ###)
  html = html.replace(/^#\s+(.*?)$/gm, '<h1 class="text-lg font-extrabold text-white mt-3 mb-1.5 font-sans tracking-wide border-b border-[#3f4147] pb-1 flex items-center gap-1.5">$1</h1>');
  html = html.replace(/^##\s+(.*?)$/gm, '<h2 class="text-sm font-bold text-[#f2f3f5] mt-3 mb-1 font-sans tracking-wide text-cyan-300 flex items-center gap-1.5">$1</h2>');
  html = html.replace(/^###\s+(.*?)$/gm, '<h3 class="text-xs font-bold text-[#dbdee1] mt-2 mb-0.5 font-sans">$1</h3>');

  // 4. Subtext / Small text (-# text)
  html = html.replace(/^-#\s+(.*?)$/gm, '<span class="text-[11px] text-[#949ba4] block leading-tight my-1">$1</span>');

  // 5. Bloques de cita (&gt; quote)
  html = html.replace(/^&gt;\s+(.*?)$/gm, '<div class="pl-3 border-l-4 border-[#4e5058] text-[#dbdee1] italic my-1.5 py-0.5">$1</div>');

  // 6. Negrita + Cursiva (***text***)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold text-white"><em class="italic">$1</em></strong>');

  // 7. Negrita (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // 8. Cursiva (*text* o _text_)
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-[#dbdee1]">$1</em>');
  html = html.replace(/(^|[^\w])_([^_]+)_(?=[^\w]|$)/g, '$1<em class="italic text-[#dbdee1]">$2</em>');

  // 9. Subrayado (__text__)
  html = html.replace(/__(.*?)__/g, '<u class="underline decoration-[#dbdee1] underline-offset-2">$1</u>');

  // 10. Tachado (~~text~~)
  html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-[#949ba4]">$1</del>');

  // 11. Código en línea (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-[#1e1f22] text-[#e0af68] rounded text-[11px] font-mono">$1</code>');

  // 12. Elementos de lista (• item o - item)
  html = html.replace(/^[•\-]\s+(.*?)$/gm, '<div class="flex items-start gap-2 my-0.5"><span class="text-[#949ba4] select-none text-xs leading-5">•</span><span class="flex-1">$1</span></div>');

  // 13. Convertir saltos de línea a <br>
  html = html.replace(/\n/g, '<br/>');

  // 14. Limpiar <br/> redundantes alrededor de bloques contenedores
  html = html.replace(/<\/pre><br\/>/g, '</pre>')
             .replace(/<\/h1><br\/>/g, '</h1>')
             .replace(/<\/h2><br\/>/g, '</h2>')
             .replace(/<\/h3><br\/>/g, '</h3>')
             .replace(/<\/div><br\/>/g, '</div>');

  return html;
}

/**
 * Divide el texto generado en bloques de hasta maxBlock caracteres,
 * sin cortar palabras ni lineas a la mitad.
 * @param {string} fullText
 * @param {number} maxBlock Limite de caracteres por bloque (default 1950)
 * @returns {string[]}
 */
export function splitIntoDiscordBlocks(fullText, maxBlock = MAX_BLOCK) {
  if (!fullText || typeof fullText !== 'string') return [];
  const lines = fullText.split('\n');
  const blocks = [];
  let current = '';

  for (const line of lines) {
    const candidate = current ? current + '\n' + line : line;
    if (candidate.length <= maxBlock) {
      current = candidate;
    } else {
      if (current) blocks.push(current);
      if (line.length > maxBlock) {
        const words = line.split(' ');
        current = '';
        for (const word of words) {
          const wCandidate = current ? current + ' ' + word : word;
          if (wCandidate.length <= maxBlock) {
            current = wCandidate;
          } else {
            if (current) blocks.push(current);
            current = word;
          }
        }
      } else {
        current = line;
      }
    }
  }

  if (current.trim()) {
    blocks.push(current);
  }

  return blocks;
}

// ═══════════════════════════════════════════════════════════════════
// 3. Backup JSON — exportar / importar
// ═══════════════════════════════════════════════════════════════════

/**
 * Descarga el personaje activo como archivo .json.
 * @param {object} char  El objeto de personaje activo
 */
export function exportCharacterJSON(char) {
  if (!char) return;

  // Desenvolver el Proxy de Alpine.js si está presente para obtener el objeto JavaScript puro
  const rawChar = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
    ? window.Alpine.raw(char)
    : char;

  const data = JSON.parse(JSON.stringify(rawChar));

  // Garantizar que la sección de Power-Scaling se incluya íntegramente
  if (char.powerScaling) {
    const rawPS = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
      ? window.Alpine.raw(char.powerScaling)
      : char.powerScaling;
    data.powerScaling = JSON.parse(JSON.stringify(rawPS));
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Agregar timestamp para trazabilidad
  const safeName = (data.name || char.name || 'personaje').replace(/[^a-z0-9_\-\s]/gi, '_');
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `ficha_${safeName}_${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Descarga una copia de seguridad agrupada con todos los personajes del roster.
 * @param {Array<object>} charactersList Lista de personajes
 */
export function exportAllCharactersJSON(charactersList) {
  if (!Array.isArray(charactersList) || charactersList.length === 0) return;

  const rawList = charactersList.map(char => {
    const rawChar = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
      ? window.Alpine.raw(char)
      : char;
    const data = JSON.parse(JSON.stringify(rawChar));
    if (char.powerScaling) {
      const rawPS = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
        ? window.Alpine.raw(char.powerScaling)
        : char.powerScaling;
      data.powerScaling = JSON.parse(JSON.stringify(rawPS));
    }
    return data;
  });

  const folders = (typeof window !== 'undefined' && window.Alpine?.store('characters')?.folders) || [];
  const payload = {
    type: 'superficha_roster_backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    totalCharacters: rawList.length,
    characters: rawList,
    folders: JSON.parse(JSON.stringify(folders))
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `superficha_backup_roster_completo_${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Descarga una copia de seguridad en JSON de todos los personajes de una carpeta específica.
 * @param {string} folderId ID de la carpeta ('unassigned' o UUID)
 * @param {Array<object>} charactersList Lista de personajes
 * @param {Array<object>} foldersList Lista de carpetas
 */
export function exportFolderCharactersJSON(folderId, charactersList, foldersList = []) {
  if (!Array.isArray(charactersList) || charactersList.length === 0) return;

  const targetFolder = foldersList.find(f => f.id === folderId) || null;
  const folderName = targetFolder ? targetFolder.name : (folderId === 'unassigned' ? 'Sin Carpeta' : 'Carpeta');

  const filteredChars = charactersList.filter(char => {
    if (folderId === 'unassigned') {
      return !char.folderId;
    }
    return char.folderId === folderId;
  });

  if (filteredChars.length === 0) return;

  const rawList = filteredChars.map(char => {
    const rawChar = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
      ? window.Alpine.raw(char)
      : char;
    const data = JSON.parse(JSON.stringify(rawChar));
    if (char.powerScaling) {
      const rawPS = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
        ? window.Alpine.raw(char.powerScaling)
        : char.powerScaling;
      data.powerScaling = JSON.parse(JSON.stringify(rawPS));
    }
    return data;
  });

  const payloadFolders = targetFolder ? [JSON.parse(JSON.stringify(targetFolder))] : [];
  const payload = {
    type: 'superficha_roster_backup',
    subType: 'superficha_folder_backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    folder: targetFolder ? JSON.parse(JSON.stringify(targetFolder)) : { id: 'unassigned', name: 'Sin Carpeta' },
    totalCharacters: rawList.length,
    characters: rawList,
    folders: payloadFolders
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const safeName = folderName.replace(/[^a-z0-9_\-\s]/gi, '_').trim().replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `superficha_carpeta_${safeName}_${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Genera el string JSON de todos los personajes de una carpeta para el portapapeles.
 * @param {string} folderId
 * @param {Array<object>} charactersList
 * @param {Array<object>} foldersList
 * @returns {string|null}
 */
export function buildFolderJSONString(folderId, charactersList, foldersList = []) {
  if (!Array.isArray(charactersList)) return null;

  const targetFolder = foldersList.find(f => f.id === folderId) || null;

  const filteredChars = charactersList.filter(char => {
    if (folderId === 'unassigned') {
      return !char.folderId;
    }
    return char.folderId === folderId;
  });

  const rawList = filteredChars.map(char => {
    const rawChar = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
      ? window.Alpine.raw(char)
      : char;
    const data = JSON.parse(JSON.stringify(rawChar));
    if (char.powerScaling) {
      const rawPS = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
        ? window.Alpine.raw(char.powerScaling)
        : char.powerScaling;
      data.powerScaling = JSON.parse(JSON.stringify(rawPS));
    }
    return data;
  });

  const payloadFolders = targetFolder ? [JSON.parse(JSON.stringify(targetFolder))] : [];
  const payload = {
    type: 'superficha_roster_backup',
    subType: 'superficha_folder_backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    folder: targetFolder ? JSON.parse(JSON.stringify(targetFolder)) : { id: 'unassigned', name: 'Sin Carpeta' },
    totalCharacters: rawList.length,
    characters: rawList,
    folders: payloadFolders
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Parsea y valida el contenido JSON de una ficha o paquete de respaldo.
 * @param {string|object} content
 * @returns {object}
 */
export function parseAndValidateJSON(content) {
  let parsed;
  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error('El texto no corresponde a un formato JSON válido.');
    }
  } else if (content && typeof content === 'object') {
    parsed = content;
  } else {
    throw new Error('Contenido JSON no válido o vacío.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Formato JSON inválido.');
  }

  const sanitizeChar = (data) => {
    if (!data || typeof data !== 'object') return null;
    if (data.character && typeof data.character === 'object') {
      data = data.character;
    }
    if (!data.id && !data.name) return null;
    data.basics = data.basics || {};
    data.body = data.body || {};
    data.mind = data.mind || {};
    data.social = data.social || {};
    data.beliefs = data.beliefs || {};
    data.priorities = data.priorities || {};
    data.skills = Array.isArray(data.skills) ? data.skills : [];
    data.weapons = Array.isArray(data.weapons) ? data.weapons : [];
    data.powerScaling = data.powerScaling || {};
    data.extras = data.extras || {};
    return data;
  };

  // Caso 1: Paquete de Respaldo de Roster Completo o Carpeta
  if (parsed.type === 'superficha_roster_backup' && Array.isArray(parsed.characters)) {
    const validChars = parsed.characters.map(sanitizeChar).filter(Boolean);
    if (validChars.length === 0) {
      throw new Error('El paquete de respaldo no contiene personajes válidos.');
    }
    const folders = Array.isArray(parsed.folders) && parsed.folders.length > 0
      ? parsed.folders
      : (parsed.folder ? [parsed.folder] : []);
    return {
      isRosterBackup: true,
      subType: parsed.subType || null,
      folder: parsed.folder || null,
      totalCharacters: validChars.length,
      characters: validChars,
      folders: folders,
      exportedAt: parsed.exportedAt || null
    };
  }

  // Caso 2: Array plano de personajes JSON
  if (Array.isArray(parsed)) {
    const validChars = parsed.map(sanitizeChar).filter(Boolean);
    if (validChars.length === 0) {
      throw new Error('El archivo no contiene personajes válidos.');
    }
    return {
      isRosterBackup: true,
      totalCharacters: validChars.length,
      characters: validChars,
      folders: []
    };
  }

  // Caso 3: Personaje individual
  const singleChar = sanitizeChar(parsed);
  if (!singleChar) {
    throw new Error('El JSON no contiene información válida de personaje (falta ID o Nombre).');
  }

  return singleChar;
}

/**
 * Lee un archivo JSON o string directo y devuelve el objeto parseado (individual o paquete masivo).
 * Valida que tenga al menos los campos mínimos del schema.
 * @param {File|string} fileOrText
 * @returns {Promise<object>}
 */
export async function importCharacterJSON(fileOrText) {
  if (!fileOrText) {
    throw new Error('No se seleccionó ningún archivo o texto.');
  }

  if (typeof fileOrText === 'string') {
    return parseAndValidateJSON(fileOrText);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = parseAndValidateJSON(e.target.result);
        resolve(result);
      } catch (error) {
        console.error('Error de parseo JSON:', error);
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo físico.'));
    reader.readAsText(fileOrText, 'utf-8');
  });
}

