// Fluted Glass Shader Background for Light Mode
(function () {
  const canvas = document.getElementById('fluted-glass-canvas');
  if (!canvas) return;

  const VERT = ttribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
};

  const FRAG = #ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec4 u_scene;      // resolution.xy, time, colour count
uniform vec4 u_shape;      // scale, intensity, paramA, warp
uniform vec4 u_surface;    // detail, contrast, brightness, saturation
uniform vec4 u_finish;     // hue, vignette, blur, grain
uniform vec4 u_transform;  // seed, rotation, drift, OKLab toggle
uniform vec4 u_space;      // offset.xy, pointer.xy
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 mixColour(vec3 a, vec3 b, float t) {
  return mix(a, b, t);
}

vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  float flutes = mix(42.0, 7.0, u_paramA);
  float cell = fract((p.x + 1.0) * flutes) - 0.5;
  float prism = sin(cell * 3.1415926) * (0.03 + u_intensity * 0.2);
  vec2 samplePoint = p + vec2(prism, sin(p.x * flutes + t * 0.2) * prism * 0.35);
  float field = fbm(samplePoint * 2.2 + vec2(t * 0.035, -t * 0.025) + u_seed);
  field += 0.24 * sin(samplePoint.y * 3.0 + samplePoint.x * 1.3);
  float highlight = pow(1.0 - abs(cell) * 2.0, mix(12.0, 2.0, u_intensity));
  float shadow = smoothstep(0.18, 0.5, abs(cell));
  vec3 glass = palette(clamp(field + highlight * 0.3, 0.0, 1.0));
  return glass * (0.72 + highlight * 0.42 - shadow * 0.12);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col = shade(uv, p, u_time);
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_grain > 0.0001)
    col += (grainHash(gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
;

  const UNIFORMS = {
    colors: [
      [0.02745, 0.10196, 0.14117],
      [0.08235, 0.36862, 0.45882],
      [0.40392, 0.90980, 0.97647],
      [0.94117, 0.99215, 0.98039],
      [0.94117, 0.99215, 0.98039],
      [0.94117, 0.99215, 0.98039],
      [0.94117, 0.99215, 0.98039],
      [0.94117, 0.99215, 0.98039]
    ],
    colorCount: 4,
    scale: 1.260,
    intensity: 0.350,
    paramA: 0.280,
    warp: 0.000,
    detail: 1.824,
    contrast: 1.005,
    brightness: 0.000,
    saturation: 1.000,
    hue: 0.0000,
    vignette: 0.000,
    blur: 0.0000,
    grain: 0.042,
    seed: 1.0,
    rotate: 0.0000,
    offsetX: 0.000,
    offsetY: 0.000,
    drift: 0.000,
    timeScale: 0.575
  };

  const gl = canvas.getContext('webgl', { antialias: false });
  if (!gl) return;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const program = gl.createProgram();
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uni = {
    colors: gl.getUniformLocation(program, 'u_colors'),
    scene: gl.getUniformLocation(program, 'u_scene'),
    shape: gl.getUniformLocation(program, 'u_shape'),
    surface: gl.getUniformLocation(program, 'u_surface'),
    finish: gl.getUniformLocation(program, 'u_finish'),
    transform: gl.getUniformLocation(program, 'u_transform'),
    space: gl.getUniformLocation(program, 'u_space'),
    cursor: gl.getUniformLocation(program, 'u_cursor')
  };

  gl.uniform3fv(uni.colors, new Float32Array(UNIFORMS.colors.flat()));
  gl.uniform4f(uni.shape, UNIFORMS.scale, UNIFORMS.intensity, UNIFORMS.paramA, UNIFORMS.warp);
  gl.uniform4f(uni.surface, UNIFORMS.detail, UNIFORMS.contrast, UNIFORMS.brightness, UNIFORMS.saturation);
  gl.uniform4f(uni.finish, UNIFORMS.hue, UNIFORMS.vignette, UNIFORMS.blur, UNIFORMS.grain);
  gl.uniform4f(uni.transform, UNIFORMS.seed, UNIFORMS.rotate, UNIFORMS.drift, 0.0);
  gl.uniform4f(uni.cursor, 0, 0, 0, 0);

  let raf = 0;
  let inView = true;
  const start = performance.now();

  const isLightMode = () => document.documentElement.getAttribute('data-theme') !== 'dark';

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(bounds.width * dpr));
    const h = Math.max(1, Math.round(bounds.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };

  function render(now) {
    raf = 0;
    if (!isLightMode() || !inView) return;
    resize();
    gl.uniform4f(uni.scene, canvas.width, canvas.height, ((now - start) / 1000) * UNIFORMS.timeScale, UNIFORMS.colorCount);
    gl.uniform4f(uni.space, UNIFORMS.offsetX, UNIFORMS.offsetY, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(render);
  }

  function startOrStop() {
    if (isLightMode() && inView) {
      if (!raf) raf = requestAnimationFrame(render);
    } else {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
  }

  window.addEventListener('resize', () => { resize(); startOrStop(); });
  new IntersectionObserver(([entry]) => {
    inView = entry ? entry.isIntersecting : true;
    startOrStop();
  }).observe(canvas);

  const observer = new MutationObserver(() => startOrStop());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  startOrStop();
})();
