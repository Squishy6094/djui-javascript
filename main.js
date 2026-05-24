const TEX_TOAD = get_texture_info("toad.png")

let t = 0;
function hud_render() {

    t += 0.05;

    const x = 200 + Math.sin(t) * 100;

    djui_hud_set_resolution(RESOLUTION_N64)

    djui_hud_set_color(255, 0, 0, 255)
    djui_hud_render_texture(TEX_TOAD, 10, 10, 1, 1)
}

hook_hud_render(hud_render);