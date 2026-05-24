// Configurable Options
const DJUI_CONFIG_FPS = 30

// Create canvas
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
canvas.style.position = "fixed";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.width = "100vw";
canvas.style.height = "100vh";

// Init WebGL2
const gl = canvas.getContext("webgl2");
if (!gl) {
    throw new Error("WebGL2 not supported");
}
gl.enable(gl.BLEND);
gl.blendFunc(
    gl.SRC_ALPHA,
    gl.ONE_MINUS_SRC_ALPHA
);

function resizeCanvas() {

    const dpr = window.devicePixelRatio || 1;

    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);

    if (
        canvas.width !== width ||
        canvas.height !== height
    ) {
        canvas.width = width;
        canvas.height = height;

        gl.viewport(0, 0, width, height);
    }
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();

// SDhader Helpers
function createShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

// Shader
const vertexShaderSource = `#version 300 es
    precision mediump float;

    in vec2 aPosition;
    in vec2 aUV;
    in vec4 aColor;

    uniform vec2 uResolution;

    out vec2 vUV;
    out vec4 vColor;

    void main() {

        vec2 zeroToOne = aPosition / uResolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(
            clipSpace.x,
            -clipSpace.y,
            0.0,
            1.0
        );

        vUV = aUV;
        vColor = aColor;
    }
`;

const fragmentShaderSource = `#version 300 es
    precision mediump float;

    in vec2 vUV;
    in vec4 vColor;

    uniform sampler2D uTexture;

    out vec4 outColor;

    void main() {
        outColor = texture(uTexture, vUV) * vColor;
    }
`;

const program = createProgram(
    gl,
    vertexShaderSource,
    fragmentShaderSource
);

gl.useProgram(program);

// Locations
const positionLocation = gl.getAttribLocation(program, "aPosition");
const uvLocation = gl.getAttribLocation(program, "aUV");
const colorLocation = gl.getAttribLocation(program, "aColor");

const resolutionLocation = gl.getUniformLocation(
    program,
    "uResolution"
);

// Buffers
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

// x y u v r g b a
const STRIDE = 8 * 4;

gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, STRIDE, 0);

gl.enableVertexAttribArray(uvLocation);
gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, STRIDE, 2 * 4);

gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, STRIDE, 4 * 4);

// Render List
const renderList = [];
const CMD_QUAD = 0;


// Texture loading
const textureDB = {};

function load_texture(name, url) {

    const image = new Image();
    image.src = url;

    image.onload = () => {

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        textureDB[name] = {
            texture: tex,
            width: image.width,
            height: image.height
        };
    };
}

// Create Dummy texture
function createWhiteTexture(gl) {

    const tex = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    const pixel = new Uint8Array([255, 255, 255, 255]);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel
    );

    // CRITICAL: prevent undefined sampling behavior
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return tex;
}

const whiteTexture = createWhiteTexture(gl);

function get_texture_info(name) {

    // already exists
    if (textureDB[name]) {
        return textureDB[name];
    }

    // create placeholder entry
    const info = {
        name,
        texture: whiteTexture,
        width: 1,
        height: 1,
        ready: false,
        loading: true
    };

    textureDB[name] = info;

    // start async load automatically
    const img = new Image();
    img.src = name; // assume direct path like "toad.png"

    img.onload = () => {

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        info.texture = tex;
        info.width = img.width;
        info.height = img.height;

        info.ready = true;
        info.loading = false;
    };

    return info;
}

function resolveTexture(t) {
    if (!t) return whiteTexture;
    if (t.texture) return t.texture; // texture info object
    return t; // already raw WebGLTexture
}

// HUD Hook
const hudRenderCallbacks = [];
function hook_hud_render(fn) {
    hudRenderCallbacks.push(fn);
}

// Recreated Funcs
const RESOLUTION_DJUI = 0
const RESOLUTION_N64 = 1
let djuiRes = 0
function djui_hud_set_resolution(resolutionType) {
    djuiRes = resolutionType
}

function internal_scale_pos(x) {
    let mathDjui = Math.min(Math.max(Math.round((canvas.height / 240) / 4.0, 0.5), 0.5), 1.5)
    let mathN64 = (canvas.height / 240)
    return x*(djuiRes == RESOLUTION_DJUI ? mathDjui : mathN64)
}

function djui_hud_get_screen_width() {
    return canvas.width/internal_scale_pos(1)
}

function djui_hud_get_screen_height() {
    return canvas.height/internal_scale_pos(1)
}

let djuiR = 1
let djuiG = 1
let djuiB = 1
let djuiA = 1
function djui_hud_set_color(r, g, b, a) {
    djuiR = (r%256)/255
    djuiG = (g%256)/255
    djuiB = (b%256)/255
    djuiA = (a%256)/255
}

let djuiRotation = 0;
let djuiPivotX = 0;
let djuiPivotY = 0;
function djui_hud_set_rotation(rotation, pivotX, pivotY) {
    djuiRotation = rotation;
    djuiPivotX = pivotX;
    djuiPivotY = pivotY;
}

function djui_hud_render_rect(x, y, w, h) {
    renderList.push({
        type: CMD_QUAD,

        x: internal_scale_pos(x),
        y: internal_scale_pos(y),
        w: internal_scale_pos(w),
        h: internal_scale_pos(h),

        u1: 0, v1: 0,
        u2: 1, v2: 1,

        texture: whiteTexture,

        r: djuiR,
        g: djuiG,
        b: djuiB,
        a: djuiA,

        rotation: djuiRotation,
        pivotX: djuiPivotX,
        pivotY: djuiPivotY
    });
}

function djui_hud_render_texture(tex, x, y, w, h) {

    if (!tex) return;

    w = w * tex.width
    h = h * tex.height

    renderList.push({
        type: CMD_QUAD,

        x: internal_scale_pos(x),
        y: internal_scale_pos(y),
        w: internal_scale_pos(w),
        h: internal_scale_pos(h),

        u1: 0, v1: 0,
        u2: 1, v2: 1,

        texture: tex.texture,

        r: djuiR,
        g: djuiG,
        b: djuiB,
        a: djuiA,

        rotation: djuiRotation,
        pivotX: djuiPivotX,
        pivotY: djuiPivotY
    });
}

function djui_hud_render_texture_tile(tex, x, y, w, h, tx, ty, tw, th) {

    if (!tex) return;

    w = w * tex.width
    h = h * tex.height
    
    renderList.push({
        type: CMD_QUAD,

        x: internal_scale_pos(x),
        y: internal_scale_pos(y),
        w: internal_scale_pos(w),
        h: internal_scale_pos(h),

        u1: tx / tex.width,
        v1: ty / tex.height,
        u2: (tx + tw) / tex.width,
        v2: (ty + th) / tex.height,

        texture: tex.texture,

        r: djuiR,
        g: djuiG,
        b: djuiB,
        a: djuiA,

        rotation: djuiRotation,
        pivotX: djuiPivotX,
        pivotY: djuiPivotY
    });
}

const FONT_NORMAL = 0
const FONT_ALIASED = 1

let djuiFont = 0
function djui_hud_set_font(fontType) {
    djuiFont = fontType
}

// Rectangle Rendering

function pushRectVertices(vertices, cmd) {
    const tex = whiteTexture;
    const u1 = 0, v1 = 0;
    const u2 = 1, v2 = 1;
    const radians = cmd.rotation * (Math.PI * 2 / 65535);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const pivotWorldX = cmd.x + cmd.w * cmd.pivotX;
    const pivotWorldY = cmd.y + cmd.h * cmd.pivotY;

    const corners = [
        [cmd.x,         cmd.y],
        [cmd.x + cmd.w, cmd.y],
        [cmd.x,         cmd.y + cmd.h],
        [cmd.x + cmd.w, cmd.y + cmd.h],
    ];

    const rotated = corners.map(([x, y]) => {

        // translate to pivot origin
        let dx = x - pivotWorldX;
        let dy = y - pivotWorldY;

        // rotate
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;

        // translate back
        return [
            rx + pivotWorldX,
            ry + pivotWorldY
        ];
    });

    const c = [
        cmd.r,
        cmd.g,
        cmd.b,
        cmd.a
    ];

    const [tl, tr, bl, br] = rotated;

    // triangle 1
    vertices.push(
        tl[0], tl[1], u1, v1, ...c,
        tr[0], tr[1], u2, v1, ...c,
        bl[0], bl[1], u1, v2, ...c
    );

    // triangle 2
    vertices.push(
        bl[0], bl[1], u1, v2, ...c,
        tr[0], tr[1], u2, v1, ...c,
        br[0], br[1], u2, v2, ...c
    );

}

function flushRenderList() {

    gl.activeTexture(gl.TEXTURE0);
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    gl.bindVertexArray(vao);

    for (const cmd of renderList) {

        const tex = cmd.texture || whiteTexture;

        const c = [cmd.r, cmd.g, cmd.b, cmd.a];

        const x1 = cmd.x;
        const y1 = cmd.y;
        const x2 = cmd.x + cmd.w;
        const y2 = cmd.y + cmd.h;

        const u1 = cmd.u1;
        const v1 = cmd.v1;
        const u2 = cmd.u2;
        const v2 = cmd.v2;

        const radians = cmd.rotation * (Math.PI * 2 / 65535);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const pivotX = cmd.x + cmd.w * cmd.pivotX;
        const pivotY = cmd.y + cmd.h * cmd.pivotY;

        const corners = [
            [x1, y1],
            [x2, y1],
            [x1, y2],
            [x2, y2],
        ];

        const rotated = corners.map(([x, y]) => {

            let dx = x - pivotX;
            let dy = y - pivotY;

            return [
                dx * cos - dy * sin + pivotX,
                dx * sin + dy * cos + pivotY
            ];
        });

        const [tl, tr, bl, br] = rotated;

        const vertices = new Float32Array([
            tl[0], tl[1], u1, v1, ...c,
            tr[0], tr[1], u2, v1, ...c,
            bl[0], bl[1], u1, v2, ...c,

            bl[0], bl[1], u1, v2, ...c,
            tr[0], tr[1], u2, v1, ...c,
            br[0], br[1], u2, v2, ...c
        ]);

        gl.bindTexture(gl.TEXTURE_2D, tex);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

const TICK_RATE = 1000 / DJUI_CONFIG_FPS;

let lastTick = 0;

function frame(now) {
    requestAnimationFrame(frame);

    if (now - lastTick >= TICK_RATE) {

        lastTick += TICK_RATE;

        renderList.length = 0;

        // Reset vars before rendering
        djuiR = 255
        djuiG = 255
        djuiB = 255
        djuiA = 255
        djuiRotation = 0
        djuiPivotX = 0
        djuiPivotY = 0

        for (const fn of hudRenderCallbacks) {
            fn();
        }
    }

    flushRenderList();
}

requestAnimationFrame(frame);

// Expose functions
Object.assign(window, {
    RESOLUTION_DJUI,
    RESOLUTION_N64,

    get_texture_info,

    hook_hud_render,

    djui_hud_render_rect,
    djui_hud_set_color,
    djui_hud_set_rotation,
    djui_hud_render_texture,
    djui_hud_render_texture_tile,
    djui_hud_set_resolution,
    djui_hud_get_screen_width,
    djui_hud_get_screen_height,
});