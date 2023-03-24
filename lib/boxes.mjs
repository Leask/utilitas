// Based on: https://github.com/sindresorhus/cli-boxes
// Repackaged to ESM by: @Leask

const single = {
    "topLeft": "┌",
    "top": "─",
    "topRight": "┐",
    "right": "│",
    "bottomRight": "┘",
    "bottom": "─",
    "bottomLeft": "└",
    "left": "│"
};

const double = {
    "topLeft": "╔",
    "top": "═",
    "topRight": "╗",
    "right": "║",
    "bottomRight": "╝",
    "bottom": "═",
    "bottomLeft": "╚",
    "left": "║"
};

const round = {
    "topLeft": "╭",
    "top": "─",
    "topRight": "╮",
    "right": "│",
    "bottomRight": "╯",
    "bottom": "─",
    "bottomLeft": "╰",
    "left": "│"
};

const bold = {
    "topLeft": "┏",
    "top": "━",
    "topRight": "┓",
    "right": "┃",
    "bottomRight": "┛",
    "bottom": "━",
    "bottomLeft": "┗",
    "left": "┃"
};

const singleDouble = {
    "topLeft": "╓",
    "top": "─",
    "topRight": "╖",
    "right": "║",
    "bottomRight": "╜",
    "bottom": "─",
    "bottomLeft": "╙",
    "left": "║"
};

const doubleSingle = {
    "topLeft": "╒",
    "top": "═",
    "topRight": "╕",
    "right": "│",
    "bottomRight": "╛",
    "bottom": "═",
    "bottomLeft": "╘",
    "left": "│"
};

const classic = {
    "topLeft": "+",
    "top": "-",
    "topRight": "+",
    "right": "|",
    "bottomRight": "+",
    "bottom": "-",
    "bottomLeft": "+",
    "left": "|"
};

const arrow = {
    "topLeft": "↘",
    "top": "↓",
    "topRight": "↙",
    "right": "←",
    "bottomRight": "↖",
    "bottom": "↑",
    "bottomLeft": "↗",
    "left": "→"
};

export default round;
export {
    single,
    double,
    round,
    bold,
    singleDouble,
    doubleSingle,
    classic,
    arrow,
};
