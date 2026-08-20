const fs = require('fs');

function parseListM(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const items = [];
  const regex = /<tr class="item">\s*<td align="center">\s*([\s\S]*?)\s*<\/td>\s*<td style=" text-align: left;">\s*([\s\S]*?)\s*<\/td>\s*<td style=" text-align: center;">\s*([\s\S]*?)\s*<\/td>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const code = match[1].replace(/<[^>]+>/g, '').trim();
    let name = match[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    const price = parseFloat(match[3].replace(/<[^>]+>/g, '').trim());
    if (name && !isNaN(price)) {
      items.push({ code, name, price, source: 'Offer List M' });
    }
  }
  return items;
}

function parseListSI(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const items = [];
  
  // tr class="item-row" data-id="..." data-tp="2500.00"
  const regex = /<tr class="item-row"[\s\S]*?data-tp="([^"]+)"[\s\S]*?<td class="first-col">\s*([\s\S]*?)\s*<\/td><td class="cell-name">\s*([\s\S]*?)\s*<\/td>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const price = parseFloat(match[1].trim());
    const code = match[2].replace(/<[^>]+>/g, '').trim();
    let name = match[3].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (name && !isNaN(price)) {
      items.push({ code, name, price, source: 'Offer List S.I' });
    }
  }
  return items;
}

const listM = parseListM('Offer list m.HTM.html');
const listSI = parseListSI('Offer list s.i.HTM.html');

console.log('List M count:', listM.length);
console.log('List SI count:', listSI.length);

const productMap = new Map();

// Helper to determine category & image based on medicine name
function getProductMetadata(name, index) {
  const upper = name.toUpperCase();
  let category = 'medicines';
  let requiresPrescription = false;
  let coldStorage = false;
  let image = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80';

  if (upper.includes('BABY') || upper.includes('DIAPER') || upper.includes('PAMPER') || upper.includes('MILK') || upper.includes('CERELAC') || upper.includes('NIPPLE')) {
    category = 'baby-care';
    image = 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80';
  } else if (upper.includes('CREAM') || upper.includes('SOAP') || upper.includes('SHAMPOO') || upper.includes('LOTION') || upper.includes('FACIAL') || upper.includes('WASH')) {
    category = 'hygiene';
    image = 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&q=80';
  } else if (upper.includes('BANDAGE') || upper.includes('SYRINGE') || upper.includes('DETTOL') || upper.includes('COTTON') || upper.includes('TAPE') || upper.includes('FIRST AID')) {
    category = 'otc-first-aid';
    image = 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&q=80';
  } else if (upper.includes('PAPER') || upper.includes('TISSUE') || upper.includes('BAG') || upper.includes('BATTERY') || upper.includes('TOOTHPASTE')) {
    category = 'general-store';
    image = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80';
  } else {
    // Default Medicines
    category = 'medicines';
    if (upper.includes('TAB') || upper.includes('CAP') || upper.includes('INJ') || upper.includes('EYE DROP') || upper.includes('SYRUP')) {
      requiresPrescription = upper.includes('TAB') || upper.includes('CAP') || upper.includes('INJ');
    }
    if (upper.includes('INSULIN') || upper.includes('VACCINE') || upper.includes('INJ')) {
      coldStorage = true;
      image = 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&q=80';
    } else {
      image = 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80';
    }
  }

  // Generic Formula Extraction heuristic
  let genericName = 'General Formulation';
  if (upper.includes('CREAM')) genericName = 'Topical Application';
  else if (upper.includes('TAB')) genericName = 'Oral Tablet';
  else if (upper.includes('CAP')) genericName = 'Oral Capsule';
  else if (upper.includes('SYP') || upper.includes('SUSP')) genericName = 'Oral Suspension';
  else if (upper.includes('EYE') || upper.includes('DROP')) genericName = 'Ophthalmic Solution';

  return {
    id: `prod_${index + 1}`,
    category,
    requiresPrescription,
    coldStorage,
    image,
    genericName,
    stock: Math.floor(Math.random() * 80) + 10,
    unit: upper.includes('TAB') ? 'Pack / Strip' : upper.includes('SYP') ? 'Bottle' : 'Piece'
  };
}

[...listM, ...listSI].forEach((item, idx) => {
  const key = item.name.toUpperCase();
  if (!productMap.has(key)) {
    const meta = getProductMetadata(item.name, productMap.size);
    productMap.set(key, {
      id: meta.id,
      code: item.code,
      name: item.name,
      genericName: meta.genericName,
      category: meta.category,
      price: item.price,
      unit: meta.unit,
      stock: meta.stock,
      requiresPrescription: meta.requiresPrescription,
      coldStorage: meta.coldStorage,
      image: meta.image
    });
  }
});

const finalProducts = Array.from(productMap.values());
console.log('Total merged catalog count:', finalProducts.length);

const content = `// Full official catalog imported from Offer List M & Offer List S.I
export const MOCK_CATEGORIES = [
  { id: 'all', label: 'All Products', icon: 'LayoutGrid' },
  { id: 'medicines', label: 'Medicines', icon: 'Pill' },
  { id: 'baby-care', label: 'Baby Care', icon: 'Baby' },
  { id: 'hygiene', label: 'Hygiene & Personal', icon: 'Sparkles' },
  { id: 'otc-first-aid', label: 'OTC & First Aid', icon: 'HeartPulse' },
  { id: 'general-store', label: 'General Store', icon: 'ShoppingBag' }
];

export const MOCK_PRODUCTS = ${JSON.stringify(finalProducts, null, 2)};
`;

fs.writeFileSync('src/mockData.js', content, 'utf8');
console.log('Successfully updated src/mockData.js with full product catalog!');
