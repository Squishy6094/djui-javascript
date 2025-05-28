if (!document.body) {
    document.documentElement.appendChild(document.createElement('body'));
}
const canvas = document.createElement('canvas');
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

function djui_hud_screen_get_width() {
    if (currentResolution === RESOLUTION_DJUI) {
        return canvas.width;
    } else if (currentResolution === RESOLUTION_N64) {
        return Math.floor(canvas.width / resN64Math); // N64 width is based off constant hieght
    }
}

function djui_hud_screen_get_height() {
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

function djui_hud_print_text(text, x, y, scale) {
    context.textBaseline = 'top'; // Align text at the top
    if (currentResolution === RESOLUTION_DJUI) {
        context.font = `${scale * 16}px Arial`; // Example font size
        context.fillText(text, x, y);
    } else if (currentResolution === RESOLUTION_N64) {
        context.font = `${scale * 16 * resN64Math}px Arial`; // Scale for N64 resolution
        context.fillText(text, x * resN64Math, y * resN64Math);
    }
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
    for (const fn of hookedFunctions) {
        fn();
    }
}
setInterval(djui_on_render, 1000 / 30); // Update 30 times a second