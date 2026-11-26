/* LYT Store: procedural phone illustrations (no photos needed).
   MS.art.phone({brand,color,view}) -> SVG string. Brand changes the camera layout + screen wallpaper. */
(function () {
  'use strict';
  const MS = (window.MS = window.MS || {});
  let uid = 0;

  const clamp = (n) => Math.max(0, Math.min(255, n));
  const toRgb = (h) => {
    h = String(h || '#444').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('');
  const shade = (hex, amt) => {
    const [r, g, b] = toRgb(hex);
    return amt >= 0 ? toHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt) : toHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
  };

  const WALL = {
    iPhone: ['#5b2fd0', '#2b6fff', '#ff5ea8'],
    Samsung: ['#0b6e6a', '#2dd4bf', '#a3e635'],
    Xiaomi: ['#ff7a3d', '#ff3d7f', '#7c3aed'],
    OPPO: ['#0a7d4f', '#22d3ee', '#3b82f6']
  };

  function lens(cx, cy, r) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0c0d12" stroke="#2f3138" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.66}" fill="#10162a" stroke="#1f2a4d" stroke-width="1.2"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="#1a2c63"/>
      <circle cx="${cx - r * 0.28}" cy="${cy - r * 0.3}" r="${r * 0.14}" fill="#fff" opacity=".55"/>`;
  }

  function cameraBlock(brand, color) {
    const plate = shade(color, -0.22);
    if (brand === 'iPhone') {
      return `<rect x="26" y="26" width="90" height="92" rx="24" fill="${plate}" stroke="${shade(color, 0.18)}" stroke-width="1.5"/>
        ${lens(56, 54, 17)}${lens(56, 92, 17)}${lens(92, 73, 17)}
        <circle cx="94" cy="42" r="5" fill="#fff6d6" opacity=".9"/><circle cx="96" cy="104" r="4" fill="#0c0d12"/>`;
    }
    if (brand === 'Samsung') {
      return `${lens(48, 56, 16)}${lens(48, 98, 16)}${lens(48, 140, 16)}
        <circle cx="84" cy="52" r="4.5" fill="#fff6d6" opacity=".85"/><circle cx="84" cy="70" r="3.5" fill="#0c0d12"/>`;
    }
    if (brand === 'Xiaomi') {
      return `<circle cx="110" cy="98" r="62" fill="${plate}" stroke="${shade(color, 0.2)}" stroke-width="2"/>
        <circle cx="110" cy="98" r="54" fill="#0b0c11"/>
        ${lens(88, 76, 17)}${lens(132, 76, 17)}${lens(88, 120, 17)}${lens(132, 120, 12)}
        <circle cx="110" cy="98" r="5" fill="#222633"/>`;
    }
    return `<circle cx="72" cy="72" r="50" fill="${plate}" stroke="${shade(color, 0.2)}" stroke-width="2"/>
      <circle cx="72" cy="72" r="43" fill="#0b0c11"/>
      ${lens(56, 56, 15)}${lens(56, 90, 15)}${lens(92, 73, 15)}
      <circle cx="94" cy="44" r="4" fill="#fff6d6" opacity=".85"/>`;
  }

  MS.art = {
    shade,
    /* flat body shape, used to give the 3D phone some thickness */
    silhouette(color) {
      const c = shade(color, -0.35);
      return `<svg viewBox="0 0 220 440" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="10" y="6" width="200" height="428" rx="34" fill="${c}"/></svg>`;
    },
    phone({ brand = 'iPhone', color = '#2a2a2c', view = 'front', title = '' } = {}) {
      const id = 'g' + uid++;
      const hi = shade(color, 0.28), lo = shade(color, -0.3);
      const w = WALL[brand] || WALL.iPhone;
      const body = `<defs>
        <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
        <linearGradient id="${id}w" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="${w[0]}"/><stop offset=".55" stop-color="${w[1]}"/><stop offset="1" stop-color="${w[2]}"/></linearGradient>
        <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <clipPath id="${id}c"><rect x="19" y="15" width="182" height="410" rx="25"/></clipPath></defs>
        <rect x="10" y="6" width="200" height="428" rx="34" fill="url(#${id}b)" stroke="${shade(color, 0.35)}" stroke-opacity=".55" stroke-width="1.5"/>
        <rect x="5" y="104" width="5" height="32" rx="2" fill="${shade(color, -0.15)}"/><rect x="5" y="150" width="5" height="32" rx="2" fill="${shade(color, -0.15)}"/>
        <rect x="210" y="132" width="5" height="62" rx="2" fill="${shade(color, -0.15)}"/>`;
      let inner;
      if (view === 'back') {
        inner = `${cameraBlock(brand, color)}
          <path d="M10 60 L120 6 L210 6 L210 150 Z" fill="url(#${id}s)" opacity=".55"/>`;
      } else {
        const notch = brand === 'iPhone'
          ? '<rect x="80" y="26" width="60" height="19" rx="9.5" fill="#000"/>'
          : '<circle cx="110" cy="34" r="6" fill="#000"/>';
        inner = `<rect x="16" y="12" width="188" height="416" rx="28" fill="#05060a"/>
          <g clip-path="url(#${id}c)">
            <rect x="19" y="15" width="182" height="410" fill="url(#${id}w)"/>
            <circle cx="60" cy="110" r="90" fill="#fff" opacity=".13"/><circle cx="190" cy="330" r="110" fill="#000" opacity=".16"/>
            <text x="110" y="132" text-anchor="middle" font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif" font-size="46" font-weight="700" fill="#fff" opacity=".95">9:41</text>
            <text x="110" y="156" text-anchor="middle" font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" fill="#fff" opacity=".8">Wednesday, 18 November</text>
            <rect x="34" y="320" width="74" height="58" rx="16" fill="#fff" opacity=".2"/><rect x="118" y="320" width="74" height="58" rx="16" fill="#fff" opacity=".14"/>
            <rect x="34" y="388" width="158" height="22" rx="11" fill="#fff" opacity=".12"/>
            <rect x="78" y="414" width="64" height="4" rx="2" fill="#fff" opacity=".85"/>
            <path d="M19 15 L120 15 L19 160 Z" fill="url(#${id}s)"/>
          </g>${notch}`;
      }
      return `<svg class="phone-svg" viewBox="0 0 220 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${MS.esc ? MS.esc(title || brand + ' phone') : 'phone'}">${body}${inner}</svg>`;
    }
  };
  /* illustrations for non-phone products (watch, AirPods, AirTag, accessories) */
  MS.art.product = function (p, color) {
    const id = 'q' + uid++;
    const c = color || '#e9e9ee';
    const hi = shade(c, 0.35), lo = shade(c, -0.25);
    const defs = `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
      <radialGradient id="${id}s" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
    let body = '';
    if (p.type === 'watch') {
      body = `<rect x="78" y="10" width="64" height="40" rx="12" fill="${shade(c, -0.4)}"/><rect x="78" y="150" width="64" height="40" rx="12" fill="${shade(c, -0.4)}"/>
        <rect x="88" y="40" width="44" height="120" rx="14" fill="url(#${id}g)" stroke="${shade(c, -0.3)}" stroke-width="1.5"/>
        <circle cx="110" cy="100" r="34" fill="#0b0c11"/><circle cx="110" cy="100" r="30" fill="#111827"/>
        <path d="M110 80 V100 L124 108" stroke="#f8fafc" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="110" cy="100" r="34" fill="url(#${id}s)"/><rect x="146" y="82" width="5" height="18" rx="2" fill="${shade(c, -0.2)}"/>`;
    } else if (p.type === 'airpod') {
      body = `<ellipse cx="78" cy="88" rx="30" ry="34" fill="url(#${id}g)" stroke="${shade(c, -0.2)}" stroke-width="1.5"/>
        <ellipse cx="142" cy="88" rx="30" ry="34" fill="url(#${id}g)" stroke="${shade(c, -0.2)}" stroke-width="1.5"/>
        <rect x="74" y="110" width="8" height="58" rx="4" fill="${shade(c, -0.1)}"/><rect x="138" y="110" width="8" height="58" rx="4" fill="${shade(c, -0.1)}"/>
        <ellipse cx="78" cy="88" rx="30" ry="34" fill="url(#${id}s)"/><ellipse cx="142" cy="88" rx="30" ry="34" fill="url(#${id}s)"/>
        <circle cx="78" cy="170" r="2.5" fill="#b8bcc6"/><circle cx="142" cy="170" r="2.5" fill="#b8bcc6"/>`;
    } else if (p.type === 'airtag') {
      body = `<circle cx="110" cy="110" r="66" fill="url(#${id}g)" stroke="${shade(c, -0.2)}" stroke-width="2"/>
        <circle cx="110" cy="110" r="66" fill="url(#${id}s)"/><circle cx="110" cy="110" r="40" fill="none" stroke="${shade(c, -0.2)}" stroke-width="1.5" opacity=".6"/>
        <circle cx="110" cy="110" r="10" fill="${shade(c, -0.25)}"/><text x="110" y="200" text-anchor="middle" font-family="Inter,Arial" font-size="11" fill="#7b7f8a">AirTag</text>`;
    } else if (p.type === 'accessory' && /cable|lightning|pencil|earpod/i.test(p.name)) {
      body = `<path d="M30 150 C 70 60, 150 220, 190 70" fill="none" stroke="${shade(c, -0.25)}" stroke-width="12" stroke-linecap="round"/>
        <path d="M30 150 C 70 60, 150 220, 190 70" fill="none" stroke="${shade(c, 0.15)}" stroke-width="4" stroke-linecap="round" opacity=".7"/>
        <rect x="16" y="136" width="28" height="28" rx="6" fill="${shade(c, -0.15)}"/><rect x="176" y="56" width="28" height="28" rx="6" fill="${shade(c, -0.15)}"/>`;
    } else {
      body = `<rect x="58" y="60" width="104" height="96" rx="22" fill="url(#${id}g)" stroke="${shade(c, -0.2)}" stroke-width="1.5"/>
        <rect x="58" y="60" width="104" height="96" rx="22" fill="url(#${id}s)"/>
        <rect x="88" y="36" width="8" height="26" rx="3" fill="#b8bcc6"/><rect x="124" y="36" width="8" height="26" rx="3" fill="#b8bcc6"/>
        <circle cx="110" cy="108" r="12" fill="${shade(c, -0.3)}" opacity=".5"/>`;
    }
    return `<svg class="prod-svg" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name ? String(p.name).replace(/&/g,'&amp;').replace(/</g,'&lt;') : 'product'}">${defs}${body}</svg>`;
  };

})();
