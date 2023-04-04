import { ensureString, supportAnsiColor } from './utilitas.mjs';
import style from './style.cjs';

const funcs = { strip: (s, o) => ensureString(s, o).replace(/\x1B\[\d+m/g, '') };

for (let color in style) {
    funcs[color] = (s, o) => {
        const [open, close] = supportAnsiColor()
            ? [style[color].open, style[color].close] : ['', ''];
        return `${open}${ensureString(s, o)}${close}`;
    }
}

export default funcs;
