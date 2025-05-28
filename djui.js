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

resN64Math = Math.floor(window.innerHeight / 240);
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resN64Math = Math.floor(window.innerHeight/240)
});
const context = canvas.getContext('2d');

// Fill a rectangle
context.fillStyle = 'red';
context.fillRect(10, 10, 50, 50); // starting x, starting y, width, height

// Stroke a rectangle
context.strokeStyle = 'blue';
context.strokeRect(100, 100, 50, 50); // starting x, starting y, width, height

const RESOLUTION_DJUI = 1
const RESOLUTION_N64 = 2
currentResolution = RESOLUTION_DJUI

function djui_hud_set_resolution(res) {
    if (res !== RESOLUTION_DJUI && res !== RESOLUTION_N64) {
        throw new Error('Invalid resolution: must be RESOLUTION_DJUI or RESOLUTION_N64');
    }
    currentResolution = res;
}

function djui_hud_screen_get_width() {
    if (currentResolution === RESOLUTION_DJUI) {
        return window.innerWidth;
    } else if (currentResolution === RESOLUTION_N64) {
        return window.innerWidth * resN64Math; // N64 width is based off constant hieght
    }
}

function djui_hud_screen_get_height() {
    if (currentResolution === RESOLUTION_DJUI) {
        return window.innerHeight;
    } else if (currentResolution === RESOLUTION_N64) {
        return 240; // N64 height is always 240 pixels
    }
}

function djui_hud_set_color(r, g, b, a) {
    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
}

function djui_hud_render_rect(x, y, width, height) {
    if (currentResolution === RESOLUTION_DJUI) {
        context.fillRect(x, y, width, height);
    } else if (currentResolution === RESOLUTION_N64) {
        context.fillRect(x * resN64Math, y * resN64Math, width * resN64Math, height * resN64Math);
    }
}

/*
const hookedFunctions = [];
function hook_event(func) {
    if (typeof func === 'function') {
        hookedFunctions.push(func);
    }
}

function djui_on_render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const fn of hookedFunctions) {
        fn();
    }
}
setInterval(on_render, 1000 / 30); // Update 30 times a second
*/