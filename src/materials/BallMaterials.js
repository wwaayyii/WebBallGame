import * as THREE from 'three';

const SIZE = 512;
let cachedMaterials;

const rng = seed => () => {
  seed |= 0;
  seed = seed + 0x6d2b79f5 | 0;
  let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
  value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

function texture(draw, seed, color = true) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  draw(canvas.getContext('2d'), rng(seed));
  const map = new THREE.CanvasTexture(canvas);
  if (color) map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.anisotropy = 8;
  return map;
}

function wood(ctx, random) {
  const data = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const warp = 17 * Math.sin(y * .021) + 9 * Math.sin(y * .057 + 1.4);
    const dx = x - SIZE * .47 + warp;
    const dy = (y - SIZE * .52) * 1.3;
    const rings = Math.sin(Math.hypot(dx, dy) * .105 + 1.2 * Math.sin(y * .035));
    const grain = Math.sin((x + 8 * Math.sin(y * .08)) * .17) * .22;
    const shade = rings * 16 + grain * 12 + (random() - .5) * 12;
    const i = (y * SIZE + x) * 4;
    data.data.set([174 + shade, 104 + shade * .62, 55 + shade * .32, 255], i);
  }
  ctx.putImageData(data, 0, 0);
  ctx.globalAlpha = .2;
  ctx.strokeStyle = '#542813';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const y = random() * SIZE;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(150, y + random() * 40 - 20, 350, y + random() * 50 - 25, SIZE, y + random() * 30 - 15);
    ctx.stroke();
  }
}

function stone(ctx, random) {
  ctx.fillStyle = '#777b7d';
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let scale = 0; scale < 3; scale++) {
    const count = [55, 150, 650][scale];
    for (let i = 0; i < count; i++) {
      const r = (3 - scale) * 5 + random() * [34, 13, 3][scale];
      ctx.fillStyle = random() > .48 ? `rgba(190,194,193,${.08 + random() * .18})` : `rgba(35,39,41,${.08 + random() * .2})`;
      ctx.beginPath();
      ctx.ellipse(random() * SIZE, random() * SIZE, r, r * (.35 + random()), random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = 'rgba(42,45,46,.18)';
  for (let i = 0; i < 9; i++) {
    let x = random() * SIZE;
    let y = random() * SIZE;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += random() * 35 - 17;
      y += random() * 28;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function createPaperPattern() {
  const random = rng(3703);
  const fibers = Array.from({ length: 520 }, () => {
    const angle = random() * Math.PI * 2;
    const length = 8 + random() * 35;
    const x = random() * SIZE;
    const y = 12 + random() * (SIZE - 24);
    return {
      x, y,
      cx: x + Math.cos(angle + (random() - .5) * 1.2) * length * .52,
      cy: y + Math.sin(angle + (random() - .5) * 1.2) * length * .52,
      ex: x + Math.cos(angle) * length,
      ey: y + Math.sin(angle) * length,
      width: .45 + random() * 1.15,
      light: random() > .62,
      alpha: .14 + random() * .16,
    };
  });
  const creases = Array.from({ length: 17 }, () => {
    const angle = random() * Math.PI * 2;
    const length = 80 + random() * 150;
    const x = random() * SIZE;
    const y = 32 + random() * (SIZE - 64);
    const bend = (random() - .5) * length * .48;
    return {
      x, y,
      cx1: x + Math.cos(angle) * length * .3 - Math.sin(angle) * bend,
      cy1: y + Math.sin(angle) * length * .3 + Math.cos(angle) * bend,
      cx2: x + Math.cos(angle) * length * .68 + Math.sin(angle) * bend * .45,
      cy2: y + Math.sin(angle) * length * .68 - Math.cos(angle) * bend * .45,
      ex: x + Math.cos(angle) * length,
      ey: y + Math.sin(angle) * length,
      width: 1.25 + random() * 2.5,
      alpha: .24 + random() * .16,
    };
  });
  return { fibers, creases };
}

const paperPattern = createPaperPattern();

function createNewspaperLayout() {
  const random = rng(4704);
  const titles = ['DAILY ROLL', 'SKY TIMES', 'BALL NEWS', 'MORNING EDITION', 'CITY ROUND', 'LATE ROLL'];
  const positions = [
    [30, 104, -.13], [190, 90, .08], [355, 112, -.06],
    [82, 302, .11], [252, 286, -.1], [438, 310, .06],
  ];
  return positions.map(([x, y, angle], index) => ({
    x,
    y,
    angle,
    title: titles[index],
    width: 138 + random() * 24,
    columns: 2 + index % 3,
    pictureColumn: index % (2 + index % 3),
    lineLengths: Array.from({ length: 40 }, () => .55 + random() * .45),
    dots: Array.from({ length: 13 }, () => ({
      x: (random() - .5) * 130,
      y: random() * 132,
      radius: .35 + random() * 1.25,
      alpha: .08 + random() * .16,
    })),
  }));
}

const newspaperLayout = createNewspaperLayout();

function paperBase(ctx, bump) {
  const data = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const u = x / SIZE * Math.PI * 2;
    const cloud = Math.sin(u * 2 + Math.sin(y * .018) * 1.7) * 5
      + Math.cos(u * 3 - y * .014) * 4
      + Math.sin(u * 5 + y * .027) * 2.5;
    const fine = Math.sin(u * 17 + y * .11) * 1.5;
    const i = (y * SIZE + x) * 4;
    if (bump) {
      const height = 132 + cloud * .7 + fine;
      data.data.set([height, height, height, 255], i);
    } else {
      data.data.set([233 + cloud + fine, 226 + cloud * .92 + fine, 205 + cloud * .72 + fine, 255], i);
    }
  }
  ctx.putImageData(data, 0, 0);
}

function strokeWrapped(ctx, feature, draw) {
  for (const offset of [-SIZE, 0, SIZE]) draw(offset);
}

function drawNewspaper(ctx) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (const region of newspaperLayout) {
    for (const wrap of [-SIZE, 0, SIZE]) {
      ctx.save();
      ctx.translate(region.x + wrap, region.y);
      ctx.rotate(region.angle);
      const left = -region.width / 2;

      ctx.fillStyle = 'rgba(55,58,57,.88)';
      ctx.font = `700 ${region.title.length > 12 ? 13 : 16}px Arial, sans-serif`;
      ctx.fillText(region.title, left, 0, region.width);
      ctx.fillRect(left, 20, region.width, 3.2);

      const gap = 5;
      const columnWidth = (region.width - gap * (region.columns - 1)) / region.columns;
      let lineIndex = 0;
      for (let column = 0; column < region.columns; column++) {
        const columnX = left + column * (columnWidth + gap);
        const hasPicture = column === region.pictureColumn;
        let lineY = 29;
        if (hasPicture) {
          const pictureHeight = 31 + (region.columns === 2 ? 8 : 0);
          ctx.fillStyle = 'rgba(104,106,101,.6)';
          ctx.fillRect(columnX, lineY, columnWidth, pictureHeight);
          ctx.strokeStyle = 'rgba(61,64,62,.82)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(columnX, lineY, columnWidth, pictureHeight);
          ctx.beginPath();
          ctx.moveTo(columnX + 2, lineY + pictureHeight - 3);
          ctx.lineTo(columnX + columnWidth * .38, lineY + pictureHeight * .42);
          ctx.lineTo(columnX + columnWidth * .58, lineY + pictureHeight * .68);
          ctx.lineTo(columnX + columnWidth - 2, lineY + 4);
          ctx.stroke();
          lineY += pictureHeight + 6;
        }
        ctx.fillStyle = 'rgba(82,85,83,.8)';
        while (lineY < 138) {
          const length = columnWidth * region.lineLengths[lineIndex++ % region.lineLengths.length];
          ctx.fillRect(columnX, lineY, length, 2.05);
          lineY += 5.2;
        }
      }

      ctx.fillStyle = 'rgba(48,51,50,.66)';
      for (const dot of region.dots) {
        ctx.globalAlpha = dot.alpha;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}

function drawPaperLines(ctx, bump) {
  ctx.lineCap = 'round';
  for (const fiber of paperPattern.fibers) {
    ctx.strokeStyle = bump
      ? `rgba(${fiber.light ? '151,151,151' : '105,105,105'},${fiber.alpha * .65})`
      : fiber.light ? `rgba(255,250,229,${fiber.alpha})` : `rgba(142,120,84,${fiber.alpha})`;
    ctx.lineWidth = fiber.width;
    strokeWrapped(ctx, fiber, offset => {
      ctx.beginPath();
      ctx.moveTo(fiber.x + offset, fiber.y);
      ctx.quadraticCurveTo(fiber.cx + offset, fiber.cy, fiber.ex + offset, fiber.ey);
      ctx.stroke();
    });
  }
  for (const crease of paperPattern.creases) {
    const drawCrease = (offset, highlight) => {
      ctx.beginPath();
      ctx.moveTo(crease.x + offset, crease.y + (highlight ? crease.width : 0));
      ctx.bezierCurveTo(crease.cx1 + offset, crease.cy1, crease.cx2 + offset, crease.cy2, crease.ex + offset, crease.ey + (highlight ? crease.width : 0));
      ctx.stroke();
    };
    ctx.strokeStyle = bump ? `rgba(65,65,65,${crease.alpha + .18})` : `rgba(116,96,67,${crease.alpha})`;
    ctx.lineWidth = crease.width;
    strokeWrapped(ctx, crease, offset => drawCrease(offset, false));
    ctx.strokeStyle = bump ? `rgba(205,205,205,${crease.alpha})` : `rgba(255,249,222,${crease.alpha + .12})`;
    ctx.lineWidth = Math.max(.75, crease.width * .48);
    strokeWrapped(ctx, crease, offset => drawCrease(offset, true));
  }
}

function paperColor(ctx) {
  paperBase(ctx, false);
  drawNewspaper(ctx);
  drawPaperLines(ctx, false);
}

function paperBump(ctx) {
  paperBase(ctx, true);
  drawPaperLines(ctx, true);
}

export function getBallMaterials() {
  if (!cachedMaterials) {
    const paperMap = texture(paperColor, 3703);
    const paperBumpMap = texture(paperBump, 3703, false);
    cachedMaterials = {
      wood: new THREE.MeshStandardMaterial({ map: texture(wood, 1701), roughness: .7, metalness: .03 }),
      stone: new THREE.MeshStandardMaterial({ map: texture(stone, 2702), roughness: .95, metalness: .02 }),
      paper: new THREE.MeshStandardMaterial({ map: paperMap, bumpMap: paperBumpMap, bumpScale: .04, roughness: .96, metalness: 0 }),
    };
  }
  return cachedMaterials;
}
