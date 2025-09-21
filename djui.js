// DJUI Customization //

// The FPS that DJUI runs at, Default is 30, set to 0 for uncapped
const DJUIJS_FPS = 30

// Sacrifices Accuracy for better mobile support with RESOLUTION_N64
const DJUIJS_SAFE_N64 = true

// Set up canvas for rendering
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

// The real stuffs

let djuiGlobalTimer = 0
function get_global_timer() {
    return djuiGlobalTimer
}

const RESOLUTION_DJUI = 1;
const RESOLUTION_N64 = 2;
let currentResolution = RESOLUTION_DJUI;
let resDJUIScale = 1; // Scale for DJUI resolution

// configDjuiScale: 0 = auto, 1 = 0.5, 2 = 0.85, 3 = 1.0, 4 = 1.5
let configDjuiScale = 0; // You can set this elsewhere as needed

function djui_gfx_get_scale() {
    if (configDjuiScale === 0) { // auto
        const windowHeight = window.innerHeight;
        if (windowHeight < 768) {
            return 0.5;
        } else if (windowHeight < 1440) {
            return 1.0;
        } else {
            return 1.5;
        }
    } else {
        switch (configDjuiScale) {
            case 1:  return 0.5;
            case 2:  return 0.85;
            case 3:  return 1.0;
            case 4:  return 1.5;
            default: return 1.0;
        }
    }
}

function get_res_scale() {
    if (currentResolution === RESOLUTION_DJUI) {
        return resDJUIScale;
    }
    else if (currentResolution === RESOLUTION_N64) {
        return resN64Math;
    }
    return 1;
}

function update_canvas_size() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    if (!DJUIJS_SAFE_N64) {
        resN64Math = window.innerHeight / 240;
    } else {
        resN64Math = Math.min(window.innerHeight / 240, window.innerWidth / 320);
    }
    resDJUIScale = djui_gfx_get_scale();
}

function djui_hud_set_resolution(res) {
    if (res !== RESOLUTION_DJUI && res !== RESOLUTION_N64) {
        throw new Error('Invalid resolution: must be RESOLUTION_DJUI or RESOLUTION_N64');
    }
    currentResolution = res;
    djui_update_mouse_scale()
}

function djui_hud_get_resolution() {
    return currentResolution
}

update_canvas_size()

function djui_hud_get_screen_width() {
    if (currentResolution === RESOLUTION_DJUI || !DJUIJS_SAFE_N64) {
        return canvas.width / get_res_scale();
    } else {
        return canvas.width / get_res_scale();
    }
}

function djui_hud_get_screen_height() {
    if (currentResolution === RESOLUTION_DJUI) {
        return canvas.height / resDJUIScale;
    } else if (currentResolution === RESOLUTION_N64) {
        if (!DJUIJS_SAFE_N64) {
            return 240; // N64 height is always 240 pixels
        } else {
            return canvas.height / get_res_scale()
        }
    }
}

function djui_hud_set_color(r, g, b, a) {
    a = a / 255;
    context.globalAlpha = a;
    context.fillStyle = `rgb(${r}, ${g}, ${b})`;
}

const renderList = [];

let currentRotation = 0;
let currentPivotX = 0;
let currentPivotY = 0;

function djui_hud_set_rotation(rotation, pivotX, pivotY) {
    currentRotation = (-rotation / 0x10000) * 360;
    currentPivotX = pivotX;
    currentPivotY = pivotY;
}

function apply_rotation_context(x, y, width, height) {
    const pivotX = x + width * currentPivotX;
    const pivotY = y + height * currentPivotY;
    context.translate(pivotX, pivotY);
    context.rotate(currentRotation * Math.PI / 180);
    context.translate(-pivotX, -pivotY);
}

let MOUSE_BUTTON_1 = (1 << 0)
let MOUSE_BUTTON_2 = (1 << 1)
let MOUSE_BUTTON_3 = (1 << 2)
let MOUSE_BUTTON_4 = (1 << 3)
let MOUSE_BUTTON_5 = (1 << 4)

let L_MOUSE_BUTTON = MOUSE_BUTTON_1
let M_MOUSE_BUTTON = MOUSE_BUTTON_2
let R_MOUSE_BUTTON = MOUSE_BUTTON_3

let _source_mouse_x = 0;
let _source_mouse_y = 0;
let _djui_mouse_x = 0;
let _djui_mouse_y = 0;
let _djui_mouse_buttons_down = 0;
let _djui_mouse_buttons_prev = 0;

// Mouse Listener
function djui_update_mouse_scale(e) {
    _djui_mouse_x = (_source_mouse_x) / get_res_scale();
    _djui_mouse_y = (_source_mouse_y) / get_res_scale();
};


canvas.addEventListener('mousemove', function (e) {
    const rect = canvas.getBoundingClientRect();
    _source_mouse_x = e.clientX - rect.left
    _source_mouse_y = e.clientY - rect.top
    djui_update_mouse_scale(e)
});

canvas.addEventListener('mousedown', function (e) {
    _djui_mouse_buttons_down |= (1 << e.button);
});

canvas.addEventListener('mouseup', function (e) {
    _djui_mouse_buttons_down &= ~(1 << e.button);
});
window.addEventListener('mouseout', (e) => {
    _djui_mouse_buttons_down &= ~(1 << e.button);
});

// Mobile "Mouse" Support
function update_touch_pos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0]; // fall back if no active touches

    if (touch) {
        _djui_mouse_x = (touch.clientX - rect.left) / get_res_scale();
        _djui_mouse_y = (touch.clientY - rect.top) / get_res_scale();
    }

    e.preventDefault(); // Prevent scrolling & mouse emulation
}

canvas.addEventListener('touchstart', function (e) {
    update_touch_pos(e);
    _djui_mouse_buttons_down |= (1 << 0);
}, { passive: false });

canvas.addEventListener('touchmove', function (e) {
    update_touch_pos(e);
}, { passive: false });

canvas.addEventListener('touchend', function (e) {
    update_touch_pos(e);
    _djui_mouse_buttons_down &= ~(1 << 0);
}, { passive: false });

canvas.addEventListener('touchcancel', function (e) {
    _djui_mouse_buttons_down &= ~(1 << 0);
}, { passive: false });


function djui_hud_get_mouse_x() {
    return _djui_mouse_x;
}

function djui_hud_get_mouse_y() {
    return _djui_mouse_y;
}

function djui_hud_get_mouse_buttons_down() {
    return _djui_mouse_buttons_down;
}

function djui_hud_get_mouse_buttons_pressed() {
    return (_djui_mouse_buttons_down & ~_djui_mouse_buttons_prev);
}

function djui_hud_get_mouse_buttons_released() {
    return (~_djui_mouse_buttons_down & _djui_mouse_buttons_prev);
}

function djui_hud_render_rect(x, y, width, height) {
    const scale = get_res_scale();
    const sx = x * scale;
    const sy = y * scale;
    const sw = width * scale;
    const sh = height * scale;
    context.save();
    apply_rotation_context(sx, sy, sw, sh);
    context.fillRect(sx, sy, sw, sh);
    context.restore();
}

const fontStyles = document.createElement('style');
const FONT_NORMAL = 1;
const FONT_ALIASED = 2;
fontStyles.textContent = `
@font-face {font-family: FONT_NORMAL; src: url('djui-js/sm64coopdx-normal.ttf') format('truetype'); font-weight: normal; font-style: normal;}
@font-face {font-family: FONT_ALIASED; src: url('djui-js/sm64coopdx-aliased.ttf') format('truetype'); font-weight: normal; font-style: normal;}
`;
document.head.appendChild(fontStyles);

context.font = '24px FONT_NORMAL';
currentFont = 'FONT_NORMAL'
currentFontSize = 32;
function djui_hud_set_font(font) {
    if (font === FONT_NORMAL) {
        currentFont = 'FONT_NORMAL';
        currentFontSize = 32;
    } else if (font === FONT_ALIASED) {
        currentFont = 'FONT_ALIASED';
        currentFontSize = 32;
    }
}
function djui_hud_measure_text(text) {
    const scale = get_res_scale();
    context.save();
    context.textBaseline = 'top';
    context.font = `${currentFontSize * scale}px ${currentFont}`;
    const metrics = context.measureText(text);
    context.restore();
    return metrics.width / scale;
}

function djui_hud_print_text(text, x, y, scale) {
    const resScale = get_res_scale();
    context.textBaseline = 'top'; // Align text at the top
    context.imageSmoothingEnabled = false;
    context.font = `${scale * currentFontSize * resScale}px ${currentFont}`;
    context.fillText(text, x * resScale, y * resScale);
}

function get_texture_info(texName) {
    const img = new Image();
    img.src = texName
    return img;
}

const gTextures = {
    luigi: get_texture_info('djui-js/luigi.png'),
    toad: get_texture_info('djui-js/toad.png'),
    waluigi: get_texture_info('djui-js/waluigi.png'),
    wario: get_texture_info('djui-js/wario.png'),
};

function djui_hud_render_texture(texture, x, y, scaleX, scaleY) {
    if (!(texture instanceof HTMLImageElement) || !texture.complete || texture.width === 0) {
        return;
    }

    const scale = get_res_scale();
    const drawX = x * scale;
    const drawY = y * scale;
    const drawW = texture.width * scaleX * scale;
    const drawH = texture.height * scaleY * scale;

    context.save();
    apply_rotation_context(drawX, drawY, drawW, drawH);
    context.imageSmoothingEnabled = false;
    context.drawImage(texture, drawX, drawY, drawW, drawH);
    context.restore();
}

function djui_hud_render_texture_tile(texture, x, y, scaleX, scaleY, tileX, tileY, tileWidth, tileHeight) {
    if (!(texture instanceof HTMLImageElement) || !texture.complete || texture.naturalWidth === 0) {
        return;
    }

    const scale = get_res_scale();
    const drawX = x * scale;
    const drawY = y * scale;
    const drawW = tileWidth * scaleX * scale;
    const drawH = tileHeight * scaleY * scale;

    context.save();
    apply_rotation_context(drawX, drawY, drawW, drawH);
    context.imageSmoothingEnabled = false;
    context.drawImage(
        texture,
        tileX, tileY, tileWidth, tileHeight, // source crop rectangle
        drawX, drawY, drawW, drawH           // destination on canvas
    );
    context.restore();
}

// DJUI Popups
let DjuiPopup = []
let sPopupListY = 4
const DJUI_POPUP_LIFETIME = 180

function djui_hud_popup_create(message, lines) {
    // Log just in case
    console.log(message)
    
    let height = lines * 32 + 32
    let split = message.split("\n")
    DjuiPopup.push({
        text: split,
        lines: lines,
        createTime: get_global_timer(),
        height: height,
        x: 8,
        y: -height,
        alpha: 1.0,
    })

    sPopupListY -= height + 4
    // play_sound(SOUND_MENU_PINCH_MARIO_FACE, gGlobalSoundSource);
}

function djui_popup_update() {
    let y = sPopupListY + 4
    let screenWidth = djui_hud_get_screen_width()

    for (let i = (DjuiPopup.length - 1); i >= 0; ) {
        let node = DjuiPopup[i]
        if (node == null) {
            i--
            continue
        }
        node.y = y
        y += node.height + 14

        let elapsed = get_global_timer() - node.createTime

        // fade out
        let alpha = Math.min(Math.max((DJUI_POPUP_LIFETIME - elapsed)/30, 0), 1)
        alpha *= alpha
        if (elapsed > DJUI_POPUP_LIFETIME) alpha = 0

        // Render Boarder (Thanks DJUI)
        djui_hud_set_color(0, 0, 0, 180 * alpha)
        djui_hud_render_rect(screenWidth - 404 - node.x, node.y, 4, node.height)
        djui_hud_render_rect(screenWidth - node.x, node.y, 4, node.height)
        djui_hud_render_rect(screenWidth - 404 - node.x, node.y - 4, 408, 4)
        djui_hud_render_rect(screenWidth - 404 - node.x, node.y + node.height, 408, 4)
        // Render BG
        djui_hud_set_color(0, 0, 0, 220 * alpha)
        djui_hud_render_rect(screenWidth - 400 - node.x, node.y, 400, node.height)
        // Render Text
        djui_hud_set_font(FONT_NORMAL);
        djui_hud_set_color(255, 255, 255, 255 * alpha)
        for (let text of node.text) {
            let height = node.height*0.5 - (node.text.length)*15 + node.text.indexOf(text)*30
            djui_hud_print_text(text, screenWidth - 200 - djui_hud_measure_text(text)*0.5 - node.x, node.y + height, 1)
        }
        
        // remove popup if fully faded
        if (alpha === 0) {
            DjuiPopup.splice(i, 1)
            continue
        }

        i--
    }

    // move entire popup list toward 4
    sPopupListY = sPopupListY * 0.75 + 1
    if (sPopupListY > 8) sPopupListY = 8
}

const hookedFunctions = [];
function hook_event(func) {
    if (typeof func === 'function') {
        hookedFunctions.push(func);
    }
}

let lastError = ""
let lastErrorTimer = 0
function djui_on_render() {
    renderList.length = 0;
    update_canvas_size()

    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const fn of hookedFunctions) {
        try {
            fn();
        } catch (error) {
            fn._errored = true;
            lastErrorTimer = 150;
            // Only log the useful part
            console.error(`${error.message} (${error.fileName || "unknown file"}:${error.lineNumber || "?"})`);
        }
    }
    
    djui_hud_set_resolution(RESOLUTION_DJUI);

    if (lastErrorTimer > 0) {
        djui_hud_set_font(FONT_NORMAL);
        djui_hud_set_rotation(0, 0, 0);

        const error = `'${document.title}' has script errors!`
        djui_hud_set_color(0, 0, 0, 255);
        djui_hud_print_text(error, djui_hud_get_screen_width() * 0.5 - djui_hud_measure_text(error) * 0.5 + 1, 31, 1);
        djui_hud_set_color(255, 0, 0, 255);
        djui_hud_print_text(error, djui_hud_get_screen_width() * 0.5 - djui_hud_measure_text(error) * 0.5, 30, 1);

        lastErrorTimer = lastErrorTimer - 1
    }
    _djui_mouse_buttons_prev = _djui_mouse_buttons_down;

    djui_popup_update()

    djuiGlobalTimer++
}
setInterval(djui_on_render, 1000/DJUIJS_FPS)