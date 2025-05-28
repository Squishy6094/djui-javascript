if (!document.body) {
    document.documentElement.appendChild(document.createElement('body'));
}

const canvas = document.createElement('canvas');
// Remove anti-aliasing
canvas.style.imageRendering = 'optimizeSpeed';
canvas.style.imageRendering = '-moz-crisp-edges';
canvas.style.imageRendering = '-o-crisp-edges';
canvas.style.imageRendering = '-webkit-optimize-contrast';
canvas.style.imageRendering = 'pixelated';
canvas.style.imageRendering = 'optimize-contrast';
canvas.style.imageRendering = 'crisp-edges';
canvas.style.msInterpolationMode = 'nearest-neighbor';

canvas.id = 'myCanvas';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
// canvas.style.width = '100vw';
// canvas.style.height = '100vh';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

let resN64Math = window.innerHeight / 240;
const context = canvas.getContext('2d');

const RESOLUTION_DJUI = 1;
const RESOLUTION_N64 = 2;
let currentResolution = RESOLUTION_DJUI;

function djui_hud_set_resolution(res) {
    if (res !== RESOLUTION_DJUI && res !== RESOLUTION_N64) {
        throw new Error('Invalid resolution: must be RESOLUTION_DJUI or RESOLUTION_N64');
    }
    currentResolution = res;
}

function djui_hud_get_screen_width() {
    if (currentResolution === RESOLUTION_DJUI) {
        return canvas.width;
    } else if (currentResolution === RESOLUTION_N64) {
        return Math.floor(canvas.width / resN64Math); // N64 width is based off constant hieght
    }
}

function djui_hud_get_screen_height() {
    if (currentResolution === RESOLUTION_DJUI) {
        return canvas.height;
    } else if (currentResolution === RESOLUTION_N64) {
        return 240; // N64 height is always 240 pixels
    }
}
function djui_hud_set_color(r, g, b, a) {
    // Clamp alpha to [0, 1] if it's in [0, 255]
    a = a / 255;
    context.globalAlpha = a;
    context.fillStyle = `rgb(${r}, ${g}, ${b})`;
}

function djui_hud_render_rect(x, y, width, height) {
    if (currentResolution === RESOLUTION_DJUI) {
        context.fillRect(x, y, width, height);
    } else if (currentResolution === RESOLUTION_N64) {
        context.fillRect(x * resN64Math, y * resN64Math, width * resN64Math, height * resN64Math);
    }
}

const fontStyles = document.createElement('style');
const FONT_NORMAL = 1;
const FONT_ALIASED = 2;
fontStyles.textContent = `
@font-face {font-family: FONT_NORMAL; src: url('djui-js/sm64coopdx-normal-font.ttf') format('truetype'); font-weight: normal; font-style: normal;}
@font-face {font-family: FONT_ALIASED; src: url('djui-js/sm64coopdx-aliased-font.ttf') format('truetype'); font-weight: normal; font-style: normal;}
`;
document.head.appendChild(fontStyles);

context.font = '24px FONT_NORMAL';
currentFont = 'FONT_NORMAL'
currentFontSize = 24;
function djui_hud_set_font(font) {
    if (font === FONT_NORMAL) {
        currentFont = 'FONT_NORMAL';
        currentFontSize = 24;
    } else if (font === FONT_ALIASED) {
        currentFont = 'FONT_ALIASED';
        currentFontSize = 24;
    }
}

function djui_hud_print_text(text, x, y, scale) {
    context.textBaseline = 'top'; // Align text at the top
    if (currentResolution === RESOLUTION_DJUI) {
        context.font = `${scale * currentFontSize}px ${currentFont}`;
        context.fillText(text, x, y);
    } else if (currentResolution === RESOLUTION_N64) {
        context.font = `${scale * currentFontSize * resN64Math}px ${currentFont}`;
        context.fillText(text, x * resN64Math, y * resN64Math);
    }
}

function djui_hud_measure_text(text) {
    // Use CanvasRenderingContext2D.measureText for better performance and accuracy
    context.save();
    context.textBaseline = 'top';
    if (currentResolution === RESOLUTION_DJUI) {
        context.font = `${currentFontSize}px ${currentFont}`;
        const metrics = context.measureText(text);
        context.restore();
        return metrics.width;
    } else if (currentResolution === RESOLUTION_N64) {
        context.font = `${currentFontSize * resN64Math}px ${currentFont}`;
        const metrics = context.measureText(text);
        context.restore();
        return metrics.width / resN64Math;
    }
    context.restore();
    return 0;
}

const hookedFunctions = [];
function hook_event(func) {
    if (typeof func === 'function') {
        hookedFunctions.push(func);
    }
}

function djui_on_render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resN64Math = window.innerHeight / 240;
    context.clearRect(0, 0, canvas.width, canvas.height);
    try {
        for (const fn of hookedFunctions) {
            fn();
        }
    } catch (error) {
        djui_hud_set_resolution(RESOLUTION_DJUI);
        const fileName = window.location.pathname.split('/').pop();
        const errorMsg = `'${fileName}' has script errors!`;
        djui_hud_set_color(0, 0, 0, 255); // Red color for error
        djui_hud_print_text(errorMsg, djui_hud_get_screen_width()*0.5 - djui_hud_measure_text(errorMsg)*0.5 + 1, 31, 1);
        djui_hud_set_color(255, 0, 0, 255); // Red color for error
        djui_hud_print_text(errorMsg, djui_hud_get_screen_width()*0.5 - djui_hud_measure_text(errorMsg)*0.5, 30, 1);
    }
}
setInterval(djui_on_render, 1000 / 30); // Update 30 times a second