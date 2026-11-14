import { describe, it, expect, beforeEach, vi } from 'vitest';
import Alpine from 'alpinejs';
import { createEmptyCharacter, ensureCharacterDefaults } from '@features/characters/schema.js';
import {
  SHEET_TYPE_META,
  normalizeSheetType,
  getOppositeSheetType,
  normalizeSkillType,
  hasPowerScalingData,
  getSheetConversionSummary,
  convertCharacterSheetData,
} from '@features/characters/sheetConverter';

const persistedRecords = new Map<string, any>();

vi.mock('@core/db/dexie.ts', () => ({
  db: {
    characters: {
      put: vi.fn(async (char: any) => {
        persistedRecords.set(char.id, JSON.parse(JSON.stringify(char)));
      }),
      delete: vi.fn(async (id: string) => {
        persistedRecords.delete(id);
      }),
    },
    meta: {
      put: vi.fn(async () => {}),
    },
  },
  runMigrationIfNecessary: vi.fn(async () => {}),
}));

import { registerCharactersStore } from '@features/characters/characters.store.js';

describe('Conversor de Fichas A (Simple) ⇄ B (Compleja)', () => {
  beforeEach(() => {
    persistedRecords.clear();
  });

  it('normalizes sheet types and skill types cleanly', () => {
    expect(normalizeSheetType('classic')).toBe('classic');
    expect(normalizeSheetType('Ficha B')).toBe('classic');
    expect(normalizeSheetType('unified')).toBe('unified');
    expect(normalizeSheetType('Ficha A')).toBe('unified');
    expect(normalizeSheetType(undefined)).toBe('unified');

    expect(getOppositeSheetType('unified')).toBe('classic');
    expect(getOppositeSheetType('classic')).toBe('unified');

    expect(normalizeSkillType('Activa')).toBe('active');
    expect(normalizeSkillType('active')).toBe('active');
    expect(normalizeSkillType('Pasiva')).toBe('passive');
    expect(normalizeSkillType('passive')).toBe('passive');
  });

  it('preserves Pasiva skill type through ensureCharacterDefaults', () => {
    const normalized = ensureCharacterDefaults({
      sheetType: 'unified',
      skills: [
        { id: 's1', title: 'Espada Lunar', type: 'Activa' },
        { id: 's2', title: 'Piel de Hierro', type: 'Pasiva' },
      ],
    });

    expect(normalized.skills[0].type).toBe('active');
    expect(normalized.skills[1].type).toBe('passive');
  });

  it('converts Ficha A -> Ficha B activating powerScaling and normalizing quick skills', () => {
    const charA = createEmptyCharacter({
      sheetType: 'unified',
      name: 'Nuevo Personaje',
      basics: {
        fullName: 'Kaelen Vane',
        nickname: 'Ceniza Errante',
        race: 'Humano',
        role: 'Cazador',
        alignment: 'Neutral Bueno',
        avatarDataUrl: 'data:image/png;base64,AVATAR_A',
        quotes: ['Nunca mires atrás.'],
      },
      body: {
        height: '1.80 m',
        weight: '76 kg',
        eyeColor: 'Ámbar',
        hairColor: 'Gris',
      },
      mind: {
        personalitySummary: 'Calculador y leal.',
        virtues: 'Templanza',
        flaws: 'Orgullo',
      },
      beliefs: {
        originEvent: 'Sobrevivió a la caída de Solitude.',
      },
      skills: [
        { id: 'sk1', title: 'Tajo Carmesí', summary: 'Corte rápido', type: 'Activa' },
        { id: 'sk2', title: 'Vista Nocturna', summary: 'Ve en la oscuridad', type: 'Pasiva' },
      ],
      weapons: [
        { id: 'wp1', name: 'Hoja Sombría', weaponType: 'Principal', damage: '' },
      ],
      powerScaling: {
        enabled: false,
        tier: '8-C',
        strikingStrength: 'Nivel Edificio',
        speed: 'Supersónico',
      },
      extras: {
        curiosities: 'Le teme al mar.',
        sentimentalItems: 'Brújula rota',
      },
    });

    expect(hasPowerScalingData(charA.powerScaling)).toBe(true);

    const charB = convertCharacterSheetData(charA, 'classic');

    expect(charB.sheetType).toBe('classic');
    expect(charB.name).toBe('Kaelen Vane');
    expect(charB.basics.fullName).toBe('Kaelen Vane');
    expect(charB.basics.avatarDataUrl).toBe('data:image/png;base64,AVATAR_A');
    expect(charB.basics.quotes).toEqual(['Nunca mires atrás.']);
    expect(charB.powerScaling.enabled).toBe(true);
    expect(charB.powerScaling.tier).toBe('8-C');
    expect(charB.powerScaling.overallTier).toBe('8-C');
    expect(charB.powerScaling.strikingStrength).toBe('Nivel Edificio');
    expect(charB.skills.map((s: any) => s.type)).toEqual(['active', 'passive']);
    expect(charB.weapons[0].rarity).toBe('Común');
    expect(charB.extras.sentimentalItems).toBe('Brújula rota');
    expect(charB.activeTabs).toContain('power');
    expect(charB.activeTabs).toContain('skills');
    expect(charB.activeTabs).toContain('weapons');
  });

  it('performs lossless round-trip B -> A -> B keeping every detailed field intact', () => {
    const complexB = createEmptyCharacter({
      sheetType: 'classic',
      name: 'Lyra Nocturne',
      basics: {
        fullName: 'Lyra Nocturne',
        nickname: 'Heraldo del Eclipse',
        race: 'Elfa Lunar',
        role: 'Arcanista',
        avatarFrame: { name: 'Marco Lunar', url: 'https://example.com/frame.png' },
        quotes: ['El silencio también canta.'],
      },
      body: {
        height: '1.72 m',
        scars: 'Cicatriz rúnica en la espalda',
        physicalDescription: 'Cabello plateado hasta los hombros.',
      },
      mind: {
        personalitySummary: 'Serena ante la tormenta.',
        mbti: 'INFJ',
        fobiasTraumas: 'Fuego descontrolado',
        sanityAnchor: 'Su grimorio familiar',
        axes: [
          { left: 'Empático', right: 'Frío', value: 25 },
        ],
      },
      social: {
        faction: 'Cónclave Gris',
        relations: [
          { id: 'rel1', name: 'Dorian', bondType: 'Aliado', status: 'Vivo', description: 'Hermano juramentado' },
        ],
        factions: [
          { id: 'fac1', name: 'Cónclave Gris', affinity: 'Leal' },
        ],
      },
      beliefs: {
        moralCode: 'Nunca dañar a inocentes',
        redLine: 'Traicionar un juramento de sangre',
        originEvent: 'Exiliada tras el concilio.',
      },
      priorities: {
        mainGoal: 'Restaurar la torre astral',
        secondaryGoals: ['Encontrar a su mentor'],
        sacrificeLine: 'Su propia inmortalidad',
      },
      skills: [
        {
          id: 'sk_b1',
          type: 'passive',
          title: 'Velo Etéreo',
          summary: 'Desvía conjuros menores',
          effect: 'Reduce daño arcano en un 30%',
          condicion: 'Luz lunar',
          tier: 'A',
          elementType: 'Arcano',
          tags: ['Defensa', 'Pasiva'],
        },
      ],
      weapons: [
        {
          id: 'wp_b1',
          name: 'Báculo del Ocaso',
          weaponType: 'Catalizador',
          rarity: 'Legendaria',
          damage: '3d10 + INT',
          linkedSkillId: 'sk_b1',
          lore: 'Tallado en hueso estelar.',
        },
      ],
      powerScaling: {
        enabled: true,
        overallTier: '7-B',
        tier: '7-B',
        dc: 'Nivel Ciudad',
        haxList: ['Manipulación Espacial', 'Sellado'],
        resistancesList: ['Ilusiones'],
        feats: [
          { id: 'f1', title: 'Contuvo el colapso del portal', targetStat: 'overallTier', tier: '7-B', auditState: 'consistent', context: 'Arco III', link: '' },
        ],
      },
      extras: {
        voiceActor: 'Eleanor Vance',
        curiosities: 'Colecciona relojes de arena.',
        gallery: [{ id: 'g1', url: 'https://example.com/art.jpg', caption: 'Arte conceptual' }],
      },
      customTabs: [
        { id: 'custom_lore', label: 'Grimorio', icon: 'book', description: 'Notas secretas', accentColor: '#c084fc', blocks: [] },
      ],
      activeTabs: ['basics', 'body', 'mind', 'social', 'beliefs', 'priorities', 'skills', 'weapons', 'power', 'extras', 'steam', 'custom_lore'],
    });

    const summaryBtoA = getSheetConversionSummary(complexB, 'unified');
    expect(summaryBtoA.sourceType).toBe('classic');
    expect(summaryBtoA.targetType).toBe('unified');
    expect(summaryBtoA.preservedSections.map((s) => s.key)).toEqual(
      expect.arrayContaining(['body', 'mind', 'social', 'beliefs', 'priorities', 'powerScaling', 'extras']),
    );

    // 1. Convertir B -> A
    const convertedA = convertCharacterSheetData(complexB, 'unified');
    expect(convertedA.sheetType).toBe('unified');

    // Simular edición rápida hecha mientras estaba en Ficha A
    convertedA.basics.nickname = 'Voz del Eclipse';
    convertedA.skills.push({ id: 'sk_a2', title: 'Destello Breve', summary: 'Ciega por 2s', type: 'active' });

    // 2. Convertir A -> B de vuelta
    const reconvertedB = convertCharacterSheetData(convertedA, 'classic');
    expect(reconvertedB.sheetType).toBe('classic');
    expect(reconvertedB.basics.nickname).toBe('Voz del Eclipse');
    expect(reconvertedB.body.scars).toBe('Cicatriz rúnica en la espalda');
    expect(reconvertedB.mind.mbti).toBe('INFJ');
    expect(reconvertedB.mind.axes[0].value).toBe(25);
    expect(reconvertedB.social.relations).toHaveLength(1);
    expect(reconvertedB.social.factions).toHaveLength(1);
    expect(reconvertedB.beliefs.moralCode).toBe('Nunca dañar a inocentes');
    expect(reconvertedB.priorities.mainGoal).toBe('Restaurar la torre astral');
    expect(reconvertedB.skills).toHaveLength(2);
    expect(reconvertedB.skills[0]).toMatchObject({
      id: 'sk_b1',
      type: 'passive',
      condicion: 'Luz lunar',
      tier: 'A',
      elementType: 'Arcano',
    });
    expect(reconvertedB.weapons[0]).toMatchObject({
      id: 'wp_b1',
      rarity: 'Legendaria',
      damage: '3d10 + INT',
      linkedSkillId: 'sk_b1',
    });
    expect(reconvertedB.powerScaling.feats).toHaveLength(1);
    expect(reconvertedB.powerScaling.haxList).toEqual(['Manipulación Espacial', 'Sellado']);
    expect(reconvertedB.customTabs).toHaveLength(1);
    expect(reconvertedB.activeTabs).toContain('custom_lore');
    expect(reconvertedB.activeTabs).toContain('steam');
    expect(reconvertedB.extras.gallery).toHaveLength(1);
  });

  it('supports store convertSheetType in-place (with undo) and createCopy (even when locked)', async () => {
    const toasts: string[] = [];
    const openedEditors: string[] = [];

    const mockAlpine: any = {
      _stores: {
        app: {
          currentTab: 'basics',
          activeTabs: ['basics', 'skills', 'weapons', 'power'],
          visitedTabs: ['basics'],
          toast: (msg: string) => toasts.push(msg),
          warmupTabs: () => {},
          saveNavigationState: () => {},
          openEditorView: (id: string) => openedEditors.push(id),
        },
      } as Record<string, any>,
      store(name: string, val?: any) {
        if (val !== undefined) this._stores[name] = val;
        return this._stores[name];
      },
      nextTick: (cb: () => void) => cb?.(),
    };

    registerCharactersStore(mockAlpine);
    const charStore = mockAlpine.store('characters');

    const baseChar = createEmptyCharacter({
      id: 'char-a-1',
      sheetType: 'unified',
      name: 'Soren',
      basics: { fullName: 'Soren', nickname: 'Ceniza' },
      skills: [{ id: 's1', title: 'Fulgor', summary: 'Luz intensa', type: 'Activa' }],
    });
    charStore.list = [baseChar];
    charStore.activeId = baseChar.id;

    // 1. Conversión in-place A -> B
    const converted = await charStore.convertSheetType(baseChar.id, 'classic', { createCopy: false });
    expect(converted?.sheetType).toBe('classic');
    expect(charStore.active.sheetType).toBe('classic');
    expect(charStore.active.skills[0].type).toBe('active');
    expect(persistedRecords.get('char-a-1')?.sheetType).toBe('classic');
    expect(charStore.undoStack.length).toBeGreaterThan(0);

    // Deshacer vuelve a 'unified' sin perder datos
    await charStore.undo();
    expect(charStore.active.sheetType).toBe('unified');

    // 2. Bloquear ficha y verificar bloqueo in-place + permiso de "Convertir en una copia"
    charStore.active.isLocked = true;
    const blocked = await charStore.convertSheetType(baseChar.id, 'classic', { createCopy: false });
    expect(blocked).toBeNull();
    expect(charStore.active.sheetType).toBe('unified');

    const copy = await charStore.convertSheetType(baseChar.id, 'classic', { createCopy: true });
    expect(copy).not.toBeNull();
    expect(copy.id).not.toBe(baseChar.id);
    expect(copy.sheetType).toBe('classic');
    expect(copy.isLocked).toBe(false);
    expect(copy.name).toBe(`Soren (${SHEET_TYPE_META.classic.code})`);
    expect(charStore.list).toHaveLength(2);
    expect(baseChar.sheetType).toBe('unified');
    expect(openedEditors).toContain(copy.id);
    expect(toasts.length).toBeGreaterThanOrEqual(2);
  });
});
