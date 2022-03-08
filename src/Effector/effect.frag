precision mediump float;

uniform sampler2D u_effectMask;
uniform sampler2D u_noise;
uniform sampler2D u_video;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_radius;
uniform float u_random;

varying vec2 v_texCoord;
float PI = 3.14159265358979323846264;
float E = 2.71828182845904523536028;

void main() {
  float timeTheta = u_time * 10.0;
  vec2 timeVec = vec2(cos(timeTheta), sin(timeTheta));
  float d = texture2D(u_noise, fract(v_texCoord + timeVec)).r;
  float theta = d * 2. * PI;
  vec2 dir = vec2(sin(theta), cos(theta));
  vec2 dVec = dir * d * 0.05;

  float eff = texture2D(u_effectMask, v_texCoord + dVec).r;
  float ring = texture2D(u_effectMask, v_texCoord + dVec).g * 0.6;

  vec4 video = texture2D(u_video, v_texCoord + dVec * eff);
  float gv = (video.r + video.g + video.b) / 3.;
  vec3 grayscale = vec3(gv, gv, gv);

  float alpha = 1. / (1. + pow(E, (eff - 0.6) * 12.0));
  vec3 inverted = vec3(1.0 - video.r, 1.0 - video.g, 1.0 - video.b);
  // vec4 warm = vec4(inverted, 1.);
  vec3 warm = vec3(0.7176, 0.0, 1.0) * inverted * max(dir.x, u_random);
  vec3 ringColor = vec3(0.29, 0.16, 1);


  gl_FragColor = vec4(
    grayscale * (1. - (2.0 * u_radius / u_resolution.x)) * alpha
      + (warm * (1.0 - ring) +  ringColor * ring * 2.)* (1. - alpha),
    1.0);
}