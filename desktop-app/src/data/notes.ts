import type { NoteDefinition } from '../types';

export const NOTES: NoteDefinition[] = [
  { note: 'C', label: 'C', solfege: 'Do', key: '1', color: '#ff5b4d', frequency: 261.63, semitoneOffset: 0 },
  { note: 'D', label: 'D', solfege: 'Re', key: '2', color: '#ffb000', frequency: 293.66, semitoneOffset: 2 },
  { note: 'E', label: 'E', solfege: 'Mi', key: '3', color: '#f2df3a', frequency: 329.63, semitoneOffset: 4 },
  { note: 'F', label: 'F', solfege: 'Fa', key: '4', color: '#5fd36a', frequency: 349.23, semitoneOffset: 5 },
  { note: 'G', label: 'G', solfege: 'Sol', key: '5', color: '#20c7c7', frequency: 392, semitoneOffset: 7 },
  { note: 'A', label: 'A', solfege: 'La', key: '6', color: '#408cff', frequency: 440, semitoneOffset: 9 },
  { note: 'B', label: 'B', solfege: 'Si', key: '7', color: '#ad6cff', frequency: 493.88, semitoneOffset: 11 }
];

export const noteByKey = new Map(NOTES.map((note) => [note.key, note]));
export const noteByName = new Map(NOTES.map((note) => [note.note, note]));

