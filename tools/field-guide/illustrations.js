// AlterU Press · Field Guide · Demo specimen-card illustrations
// 19th c. natural-history / museum-catalogue style.
// Hand-drawn SVG placeholders. In production, replaced by gen-image API output
// using user's photo as ref + illustration_prompt from the Claude dossier.

const SPECIMEN_HEAD = (sci) => `
  <text x="500" y="86" text-anchor="middle" font-family="Playfair Display, serif" font-weight="700" font-size="22" letter-spacing="4" fill="#0F0F0F">PLATE I</text>
  <text x="500" y="118" text-anchor="middle" font-family="Playfair Display, serif" font-style="italic" font-size="17" fill="#6B6B6B">${sci}</text>
  <line x1="180" y1="138" x2="820" y2="138" stroke="#0F0F0F" stroke-width="0.5"/>
`;

const FRAME = `
  <rect width="1000" height="1000" fill="#F0EAD8"/>
  <rect x="40" y="40" width="920" height="920" fill="none" stroke="#0F0F0F" stroke-width="2"/>
  <rect x="50" y="50" width="900" height="900" fill="none" stroke="#0F0F0F" stroke-width="0.5"/>
`;

const FOOTER = (n) => `
  <line x1="180" y1="900" x2="820" y2="900" stroke="#0F0F0F" stroke-width="0.5"/>
  <text x="500" y="930" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="3" fill="#6B6B6B">ALTERU PRESS · FIELD GUIDE · pl. ${n}</text>
`;

const LABEL = (text, lx, ly, ax1, ay1, ax2, ay2, anchor = "start") => `
  <text x="${lx}" y="${ly}" text-anchor="${anchor}" font-family="Playfair Display, serif" font-style="italic" font-size="20" fill="#0F0F0F">${text}</text>
  <path d="M ${ax1} ${ay1} L ${ax2} ${ay2}" stroke="#0F0F0F" stroke-width="0.6" stroke-dasharray="3,3" fill="none"/>
  <circle cx="${ax2}" cy="${ay2}" r="2" fill="#0F0F0F"/>
`;

// ---------- Hat ----------
export const HAT_ILLUSTRATION = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  ${FRAME}
  ${SPECIMEN_HEAD("Carludovica palmata · woven straw")}

  <!-- brim back half (behind crown) -->
  <path d="M 220 540 Q 500 590 780 540" fill="#E8DEC7" stroke="#0F0F0F" stroke-width="2.5"/>

  <!-- crown -->
  <path d="M 320 540 Q 320 380 500 360 Q 680 380 680 540 Z" fill="#E8DEC7" stroke="#0F0F0F" stroke-width="2.5"/>

  <!-- crown crease (optimo style) -->
  <path d="M 360 410 Q 500 430 640 410" fill="none" stroke="#6B6B6B" stroke-width="1" opacity="0.6"/>
  <path d="M 500 360 L 500 460" stroke="#6B6B6B" stroke-width="1" opacity="0.4"/>

  <!-- band -->
  <rect x="320" y="510" width="360" height="22" fill="#0F0F0F"/>
  <!-- ribbon bow knot -->
  <path d="M 670 521 L 685 515 L 700 521 L 685 527 Z" fill="#0F0F0F"/>

  <!-- brim front edge -->
  <path d="M 220 540 Q 500 605 780 540 Q 760 555 500 565 Q 240 555 220 540 Z" fill="#D9CDA8" stroke="#0F0F0F" stroke-width="2.5"/>

  <!-- weave hatching on crown -->
  <g stroke="#8B7355" stroke-width="0.5" opacity="0.45" fill="none">
    <path d="M 360 400 L 380 530"/>
    <path d="M 400 380 L 420 530"/>
    <path d="M 440 370 L 460 530"/>
    <path d="M 480 365 L 500 530"/>
    <path d="M 520 365 L 540 530"/>
    <path d="M 560 370 L 580 530"/>
    <path d="M 600 380 L 620 530"/>
    <path d="M 640 400 L 620 530"/>
    <path d="M 330 480 L 670 480" opacity="0.3"/>
    <path d="M 330 440 L 670 440" opacity="0.3"/>
  </g>

  <!-- labels with callouts -->
  ${LABEL("crown", 880, 410, 870, 405, 660, 410, "end")}
  ${LABEL("brim", 140, 560, 150, 555, 270, 555)}
  ${LABEL("ribbon", 880, 530, 870, 525, 715, 521, "end")}
  ${LABEL("weave", 140, 460, 150, 455, 350, 460)}

  ${FOOTER("I")}
</svg>
`;

// ---------- Teapot ----------
export const TEAPOT_ILLUSTRATION = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  ${FRAME}
  ${SPECIMEN_HEAD("Yixing zisha · purple clay vessel")}

  <!-- body -->
  <ellipse cx="500" cy="560" rx="200" ry="170" fill="#5C3A2E" stroke="#0F0F0F" stroke-width="2.5"/>
  <!-- body shadow -->
  <path d="M 320 560 Q 320 600 360 700 Q 500 740 640 700 Q 680 600 680 560" fill="#3B2519" opacity="0.4"/>
  <!-- body highlight -->
  <ellipse cx="450" cy="470" rx="60" ry="20" fill="#8B5C45" opacity="0.4"/>

  <!-- foot ring -->
  <ellipse cx="500" cy="720" rx="120" ry="14" fill="#0F0F0F" opacity="0.5"/>

  <!-- lid -->
  <ellipse cx="500" cy="396" rx="100" ry="14" fill="#5C3A2E" stroke="#0F0F0F" stroke-width="2"/>
  <path d="M 400 396 Q 500 386 600 396" fill="none" stroke="#0F0F0F" stroke-width="2"/>
  <ellipse cx="500" cy="392" rx="100" ry="10" fill="#6E4738" stroke="#0F0F0F" stroke-width="1.5"/>

  <!-- pearl knob -->
  <circle cx="500" cy="378" r="14" fill="#5C3A2E" stroke="#0F0F0F" stroke-width="2"/>
  <circle cx="496" cy="374" r="4" fill="#8B5C45"/>

  <!-- spout (left, curved) -->
  <path d="M 300 540 Q 230 510 200 460 Q 195 445 210 440 Q 240 480 310 510 Z" fill="#5C3A2E" stroke="#0F0F0F" stroke-width="2"/>
  <ellipse cx="205" cy="450" rx="8" ry="4" fill="#0F0F0F"/>

  <!-- handle (right) -->
  <path d="M 700 510 Q 800 510 800 600 Q 800 660 700 670" fill="none" stroke="#0F0F0F" stroke-width="14"/>
  <path d="M 700 510 Q 800 510 800 600 Q 800 660 700 670" fill="none" stroke="#5C3A2E" stroke-width="10"/>

  <!-- labels -->
  ${LABEL("lid", 880, 380, 870, 375, 605, 392, "end")}
  ${LABEL("pearl", 140, 360, 150, 365, 485, 378)}
  ${LABEL("spout", 140, 460, 150, 465, 230, 470)}
  ${LABEL("body", 140, 580, 150, 580, 300, 580)}
  ${LABEL("handle", 880, 600, 870, 600, 805, 600, "end")}

  ${FOOTER("II")}
</svg>
`;

// ---------- Satchel ----------
export const SATCHEL_ILLUSTRATION = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  ${FRAME}
  ${SPECIMEN_HEAD("Bursa coriacea · vegetable-tanned leather")}

  <!-- strap (behind body, arch over top) -->
  <path d="M 290 440 Q 290 250 500 230 Q 710 250 710 440" fill="none" stroke="#0F0F0F" stroke-width="22"/>
  <path d="M 290 440 Q 290 250 500 230 Q 710 250 710 440" fill="none" stroke="#7A5036" stroke-width="16"/>
  <!-- strap stitching hint -->
  <path d="M 290 440 Q 290 250 500 230 Q 710 250 710 440" fill="none" stroke="#3B2519" stroke-width="0.6" stroke-dasharray="6,4"/>

  <!-- body rectangle -->
  <rect x="270" y="430" width="460" height="320" rx="12" fill="#8C6142" stroke="#0F0F0F" stroke-width="2.5"/>
  <rect x="270" y="430" width="460" height="320" rx="12" fill="url(#leatherTexture)" opacity="0.4"/>

  <!-- gusset side hint (right edge perspective) -->
  <path d="M 730 430 Q 760 440 760 740 Q 745 750 730 750 Z" fill="#6E4830" stroke="#0F0F0F" stroke-width="2.5"/>

  <!-- flap -->
  <path d="M 250 430 L 750 430 L 770 600 Q 760 615 740 615 L 260 615 Q 240 615 230 600 Z" fill="#A07550" stroke="#0F0F0F" stroke-width="2.5"/>
  <!-- flap stitching -->
  <path d="M 265 445 L 735 445 M 245 600 L 755 600" fill="none" stroke="#3B2519" stroke-width="0.5" stroke-dasharray="5,4" opacity="0.7"/>

  <!-- buckles (two brass) -->
  <g>
    <rect x="380" y="560" width="50" height="80" rx="6" fill="#C8A45A" stroke="#0F0F0F" stroke-width="2"/>
    <rect x="392" y="572" width="26" height="56" rx="3" fill="none" stroke="#0F0F0F" stroke-width="1.5"/>
    <line x1="405" y1="572" x2="405" y2="628" stroke="#0F0F0F" stroke-width="1.5"/>
  </g>
  <g>
    <rect x="570" y="560" width="50" height="80" rx="6" fill="#C8A45A" stroke="#0F0F0F" stroke-width="2"/>
    <rect x="582" y="572" width="26" height="56" rx="3" fill="none" stroke="#0F0F0F" stroke-width="1.5"/>
    <line x1="595" y1="572" x2="595" y2="628" stroke="#0F0F0F" stroke-width="1.5"/>
  </g>

  <!-- corner wear hints -->
  <path d="M 280 745 Q 290 740 300 745" fill="none" stroke="#3B2519" stroke-width="0.6"/>
  <path d="M 720 745 Q 710 740 700 745" fill="none" stroke="#3B2519" stroke-width="0.6"/>

  <!-- labels -->
  ${LABEL("strap", 140, 290, 150, 295, 350, 290)}
  ${LABEL("flap", 880, 480, 870, 480, 760, 500, "end")}
  ${LABEL("buckles", 140, 600, 150, 600, 375, 600)}
  ${LABEL("gusset", 880, 650, 870, 650, 760, 600, "end")}
  ${LABEL("body", 880, 730, 870, 725, 720, 720, "end")}

  ${FOOTER("III")}
</svg>
`;

export const DEMO_ILLUSTRATIONS = {
  hat: HAT_ILLUSTRATION,
  teapot: TEAPOT_ILLUSTRATION,
  satchel: SATCHEL_ILLUSTRATION,
};

export function svgToDataUrl(svg) {
  // Encode SVG as base64 data URI so it can be embedded inside another SVG via <image>
  const utf8 = unescape(encodeURIComponent(svg));
  return "data:image/svg+xml;base64," + btoa(utf8);
}
