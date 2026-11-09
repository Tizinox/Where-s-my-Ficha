/**
 * alignments.js
 * Diccionario de Alineaciones Morales para la ficha de personaje (D&D / RP).
 * Mapea cada alineación con una descripción breve y ejemplos emblemáticos.
 */

export const ALIGNMENTS_DICT = {
  'Legal Bueno': {
    name: 'Legal Bueno',
    english: 'Lawful Good',
    description: 'Sigue un código moral estricto para hacer el bien.',
    examples: ['Superman', 'Captain America', 'Obi-Wan Kenobi'],
  },
  'Neutral Bueno': {
    name: 'Neutral Bueno',
    english: 'Neutral Good',
    description: 'Altruista y enfocado en hacer lo correcto sin atarse ciegamente a las reglas.',
    examples: ['Spider-Man', 'Gandalf', 'Harry Potter'],
  },
  'Caótico Bueno': {
    name: 'Caótico Bueno',
    english: 'Chaotic Good',
    description: 'Sigue su propia brújula moral por el bien común, rebelándose contra leyes injustas.',
    examples: ['Robin Hood', 'Han Solo', 'Luffy'],
  },
  'Legal Neutral': {
    name: 'Legal Neutral',
    english: 'Lawful Neutral',
    description: 'Cree firmemente en el orden, la tradición o la ley, por encima del bien y del mal.',
    examples: ['Judge Dredd', 'Stannis Baratheon', 'Mando / Din Djarin'],
  },
  'Neutral Absoluto': {
    name: 'Neutral Absoluto',
    english: 'True Neutral',
    description: 'Busca el equilibrio, actúa por pragmatismo o neutralidad natural.',
    examples: ['Geralt de Rivia', 'Treebeard', 'Boba Fett'],
  },
  'Caótico Neutral': {
    name: 'Caótico Neutral',
    english: 'Chaotic Neutral',
    description: 'Prioriza su libertad personal sobre todo; impredecible pero no intrínsecamente malvado.',
    examples: ['Jack Sparrow', 'Catwoman', 'Deadpool'],
  },
  'Legal Malvado': {
    name: 'Legal Malvado',
    english: 'Lawful Evil',
    description: 'Utiliza el código, la jerarquía o las leyes para lograr sus fines malvados o de dominación.',
    examples: ['Darth Vader', 'Tywin Lannister', 'Sauron'],
  },
  'Neutral Malvado': {
    name: 'Neutral Malvado',
    english: 'Neutral Evil',
    description: 'Busca su propio beneficio sin remordimientos, usando a los demás sin atarse a códigos ni al caos.',
    examples: ['Voldemort', 'Littlefinger', 'Cersei Lannister'],
  },
  'Caótico Malvado': {
    name: 'Caótico Malvado',
    english: 'Chaotic Evil',
    description: 'Impulsado por el deseo de destrucción, crueldad, codicia o caos descontrolado.',
    examples: ['Joker', 'Bellatrix Lestrange', 'Carnage'],
  },
};
