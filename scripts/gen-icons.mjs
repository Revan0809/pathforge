import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/icons')
mkdirSync(OUT, { recursive: true })

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

function makeSvg(size) {
  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.244)}" fill="#12102A"/>
  <g transform="scale(${size / 90})">
    <polygon points="45,14 58,32 52,32 52,45 62,45 62,55 52,55 52,76 45,76 45,55 38,55 38,45 48,45 48,32 38,32" fill="#7C3AED"/>
    <path d="M30 52 C24 46 24 32 34 26" stroke="#C4B5FD" stroke-width="5" stroke-linecap="round" fill="none"/>
    <circle cx="30" cy="54" r="5" fill="#8B5CF6"/>
    <circle cx="45" cy="14" r="4" fill="#F59E0B"/>
    <circle cx="62" cy="45" r="3" fill="#06B6D4"/>
    <circle cx="45" cy="76" r="2.5" fill="#10B981"/>
  </g>
</svg>`)
}

for (const size of SIZES) {
  await sharp(makeSvg(size)).png().toFile(join(OUT, `icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}
console.log('All PNG icons generated in public/icons/')
