import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create an SVG representation matching the official D'Santos Perfumería branding
const svgLogo = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <!-- Background Radial Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#141414" />
      <stop offset="70%" stop-color="#080808" />
      <stop offset="100%" stop-color="#020202" />
    </radialGradient>

    <!-- Rich Gold Gradients -->
    <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE8B3" />
      <stop offset="25%" stop-color="#E5B96B" />
      <stop offset="50%" stop-color="#BA8032" />
      <stop offset="75%" stop-color="#FBE2A7" />
      <stop offset="100%" stop-color="#99601E" />
    </linearGradient>

    <linearGradient id="goldGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF2D6" />
      <stop offset="35%" stop-color="#D49B45" />
      <stop offset="70%" stop-color="#A76E23" />
      <stop offset="100%" stop-color="#EFC67E" />
    </linearGradient>

    <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAD4DF" />
      <stop offset="40%" stop-color="#E29EB3" />
      <stop offset="80%" stop-color="#C06C86" />
      <stop offset="100%" stop-color="#934159" />
    </linearGradient>

    <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE4ED" />
      <stop offset="30%" stop-color="#EFA8BD" />
      <stop offset="70%" stop-color="#BA5674" />
      <stop offset="100%" stop-color="#6E2339" />
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Deep Black Luxury Background -->
  <rect width="800" height="800" fill="url(#bgGrad)" />

  <g transform="translate(400, 260) scale(0.95)">
    <!-- Perfume Bottle Top Spray & Gem Cap -->
    <!-- Atomizer Nozzle -->
    <rect x="-24" y="-235" width="48" height="28" rx="5" fill="url(#goldGrad1)" stroke="#593910" stroke-width="2" />
    <circle cx="0" cy="-221" r="5" fill="#221508" />
    <!-- Connector neck -->
    <rect x="-14" y="-208" width="28" height="18" fill="url(#goldGrad2)" />
    
    <!-- Faceted Gem Spray Bulb / Cap on right -->
    <g transform="translate(90, -200) rotate(24)">
      <!-- Connector tube -->
      <path d="M -50 20 Q -25 5 0 0" stroke="url(#goldGrad1)" stroke-width="6" fill="none" />
      <!-- Faceted diamond gem -->
      <polygon points="0,-28 40,-45 80,-25 68,28 12,28" fill="url(#gemGrad)" stroke="url(#goldGrad2)" stroke-width="3" />
      <polygon points="40,-45 42,-10 0,-28" fill="#FFF2F6" opacity="0.6" />
      <polygon points="40,-45 80,-25 42,-10" fill="#E887A4" opacity="0.7" />
      <polygon points="42,-10 68,28 12,28" fill="#B04363" opacity="0.8" />
    </g>

    <!-- Outer Circular Golden Perfume Ring Frame -->
    <circle cx="0" cy="0" r="175" fill="none" stroke="url(#goldGrad1)" stroke-width="16" />
    <circle cx="0" cy="0" r="162" fill="none" stroke="url(#goldGrad2)" stroke-width="4" opacity="0.6" />
    <circle cx="0" cy="0" r="184" fill="none" stroke="url(#goldGrad1)" stroke-width="2" opacity="0.4" />

    <!-- Lady Silhouette intertwined with 'S' curve -->
    <!-- Upper hair curve & head -->
    <path d="M -20 -150 C 40 -150, 110 -100, 105 -20 C 100 50, 30 70, 45 140 C 50 160, 60 170, 75 168 C 50 175, 10 160, 5 125 C -5 60, 75 40, 70 -20 C 65 -70, 15 -115, -20 -125 Z" fill="url(#goldGrad2)" />
    
    <!-- Rose Hair highlights -->
    <path d="M -5 -135 C 35 -135, 80 -95, 75 -25 C 70 30, 20 50, 30 110 C 20 90, 40 50, 50 0 C 60 -50, 20 -95, -5 -115 Z" fill="url(#roseGrad)" />
    <path d="M -30 -115 C -5 -115, 45 -85, 45 -35 C 45 10, 10 30, 15 80 C 5 60, 25 25, 25 -15 C 25 -55, -5 -85, -30 -100 Z" fill="url(#roseGrad)" opacity="0.8" />

    <!-- Face profile (left facing) -->
    <path d="M -45 -90 C -35 -80, -25 -70, -28 -55 C -30 -45, -45 -35, -45 -25 C -45 -18, -35 -15, -38 -5 C -40 5, -55 10, -50 25 C -45 40, -25 55, 0 65 C -20 62, -45 50, -60 30 C -70 12, -65 -10, -55 -28 C -50 -38, -60 -50, -55 -65 C -50 -78, -48 -85, -45 -90 Z" fill="url(#goldGrad1)" />
    <!-- Closed serene eyelid -->
    <path d="M -42 -40 Q -36 -43 -32 -38" stroke="#3A2209" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M -32 -38 L -30 -42" stroke="#3A2209" stroke-width="1.5" stroke-linecap="round" />

    <!-- Bust & Body Curve forming base of S -->
    <path d="M -60 30 C -40 70, 10 110, 80 130 C 50 150, -10 150, -60 115 C -85 95, -95 65, -80 40 Z" fill="url(#goldGrad2)" />
    
    <!-- Rose leaf & golden droplets flourish at bottom right -->
    <path d="M 50 120 C 80 125, 120 110, 145 95 C 130 120, 100 145, 65 145 Z" fill="url(#roseGrad)" />
    <path d="M 85 100 C 115 100, 145 80, 160 65 C 150 90, 125 110, 95 115 Z" fill="url(#goldGrad1)" opacity="0.85" />
    <circle cx="125" cy="55" r="8" fill="url(#goldGrad1)" />
    <circle cx="145" cy="40" r="6" fill="url(#goldGrad2)" />
    <circle cx="35" cy="145" r="6" fill="url(#goldGrad1)" />
  </g>

  <!-- Typography: D'Santos -->
  <g transform="translate(400, 560)">
    <text text-anchor="middle" y="0" font-family="'Cinzel', 'Playfair Display', 'Didot', 'Georgia', 'Times New Roman', serif" font-size="106" font-weight="700" letter-spacing="4" fill="url(#goldGrad1)" filter="url(#goldGlow)">
      D'Santos
    </text>
    <!-- Rose petal accent on the 's' -->
    <path d="M 185 -75 C 205 -95, 230 -90, 235 -70 C 220 -60, 200 -62, 185 -75 Z" fill="url(#roseGrad)" />
  </g>

  <!-- Divider line with Rose Petal centerpiece -->
  <g transform="translate(400, 615)">
    <line x1="-280" y1="0" x2="-35" y2="0" stroke="url(#goldGrad1)" stroke-width="2" />
    <line x1="35" y1="0" x2="280" y2="0" stroke="url(#goldGrad1)" stroke-width="2" />
    <!-- 3 Rose petals in center -->
    <path d="M 0 -12 C 7 -4, 7 4, 0 10 C -7 4, -7 -4, 0 -12 Z" fill="url(#roseGrad)" />
    <path d="M -12 -5 C -6 -1, -5 6, -12 8 C -17 3, -16 -3, -12 -5 Z" fill="url(#roseGrad)" />
    <path d="M 12 -5 C 6 -1, 5 6, 12 8 C 17 3, 16 -3, 12 -5 Z" fill="url(#roseGrad)" />
  </g>

  <!-- Subtitles -->
  <!-- PERFUMERÍA -->
  <text x="400" y="670" text-anchor="middle" font-family="'Montserrat', 'Cinzel', 'Arial', sans-serif" font-size="34" font-weight="600" letter-spacing="16" fill="url(#roseGrad)">
    PERFUMERÍA
  </text>

  <!-- Y CUIDADO PERSONAL -->
  <text x="400" y="720" text-anchor="middle" font-family="'Montserrat', 'Arial', sans-serif" font-size="22" font-weight="500" letter-spacing="12" fill="#FFF8EF" opacity="0.95">
    Y CUIDADO PERSONAL
  </text>
</svg>
`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgLogo);
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgLogo);

async function generatePngs() {
  const svgBuffer = Buffer.from(svgLogo);

  // 192x192 PWA Icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 512x512 PWA Icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // Maskable 512x512 Icon with 15% safe padding
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#080808'
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Logo 800x800 high res
  await sharp(svgBuffer)
    .resize(800, 800)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // Favicon 64x64 ico/png
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Successfully generated all PWA icons and official D\'Santos brand assets!');
}

generatePngs().catch(console.error);
