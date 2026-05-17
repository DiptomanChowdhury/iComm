const BASE_KEY = { width: 1 };

function k(id, label, opts = {}) {
  return { id, label, displayLabel: opts.displayLabel || label, width: opts.width || 1 };
}

export const ALPHA_LAYOUT = {
  rows: [
    [
      k('Q', 'Q'), k('W', 'W'), k('E', 'E'), k('R', 'R'), k('T', 'T'),
      k('Y', 'Y'), k('U', 'U'), k('I', 'I'), k('O', 'O'), k('P', 'P'),
      k('BACKSPACE', '\u232B', { displayLabel: 'Backspace', width: 1.5 }),
    ],
    [
      k('A', 'A'), k('S', 'S'), k('D', 'D'), k('F', 'F'), k('G', 'G'),
      k('H', 'H'), k('J', 'J'), k('K', 'K'), k('L', 'L'),
      k('ENTER', '\u23CE', { displayLabel: 'Enter', width: 1.5 }),
    ],
    [
      k('SHIFT', '\u21E7', { displayLabel: 'Shift', width: 1.5 }),
      k('Z', 'Z'), k('X', 'X'), k('C', 'C'), k('V', 'V'), k('B', 'B'),
      k('N', 'N'), k('M', 'M'),
      k(',', ','), k('.', '.'), k('!', '!'), k('?', '?'),
    ],
  ],
};

export const ALPHA_LAYOUT_SHIFT = {
  rows: [
    [
      k('Q', 'Q'), k('W', 'W'), k('E', 'E'), k('R', 'R'), k('T', 'T'),
      k('Y', 'Y'), k('U', 'U'), k('I', 'I'), k('O', 'O'), k('P', 'P'),
      k('BACKSPACE', '\u232B', { displayLabel: 'Backspace', width: 1.5 }),
    ],
    [
      k('A', 'A'), k('S', 'S'), k('D', 'D'), k('F', 'F'), k('G', 'G'),
      k('H', 'H'), k('J', 'J'), k('K', 'K'), k('L', 'L'),
      k('ENTER', '\u23CE', { displayLabel: 'Enter', width: 1.5 }),
    ],
    [
      k('SHIFT', '\u21E7\u25CF', { displayLabel: 'Shift', width: 1.5 }),
      k('Z', 'Z'), k('X', 'X'), k('C', 'C'), k('V', 'V'), k('B', 'B'),
      k('N', 'N'), k('M', 'M'),
      k(',', ','), k('.', '.'), k('!', '!'), k('?', '?'),
    ],
  ],
};

export const NUMBERS_LAYOUT = {
  rows: [
    [
      k('1', '1'), k('2', '2'), k('3', '3'), k('4', '4'), k('5', '5'),
      k('6', '6'), k('7', '7'), k('8', '8'), k('9', '9'), k('0', '0'),
      k('BACKSPACE', '\u232B', { displayLabel: 'Backspace', width: 1.5 }),
    ],
    [
      k('-', '-'), k('/', '/'), k(':', ':'), k(';', ';'),
      k('(', '('), k(')', ')'), k('$', '$'), k('&', '&'),
      k('@', '@'), k('"', '"'),
      k('ENTER', '\u23CE', { displayLabel: 'Enter', width: 1.5 }),
    ],
    [
      k('#', '#'), k('%', '%'), k('^', '^'), k('*', '*'),
      k('+', '+'), k('=', '='),
      k('_', '_'), k('\\', '\\'), k('|', '|'), k('~', '~'),
      k('<', '<'), k('>', '>'),
    ],
  ],
};

export const BOTTOM_ROW = [
  k('TOGGLE_LAYOUT', '123', { displayLabel: '123', width: 1.5 }),
  k('SPACE', ' ', { displayLabel: 'Space', width: 5 }),
  k('TOGGLE_LANGUAGE', '\U0001F310', { displayLabel: 'Lang', width: 1.5 }),
  { id: 'LAYOUT', label: '\u2299', displayLabel: 'Layout', width: 1.5 },
];
