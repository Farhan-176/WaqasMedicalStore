const fs = require('fs');

function parseHtmlProducts(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const items = [];
  
  // Regex pattern matching items table row
  const rowRegex = /<tr class="item">\s*<td align="center">\s*([\s\S]*?)\s*<\/td>\s*<td style=" text-align: left;">\s*([\s\S]*?)\s*<\/td>\s*<td style=" text-align: center;">\s*([\s\S]*?)\s*<\/td>/g;
  
  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    const code = match[1].replace(/<[^>]+>/g, '').trim();
    let name = match[2].replace(/<[^>]+>/g, '').trim();
    const priceStr = match[3].replace(/<[^>]+>/g, '').trim();
    const price = parseFloat(priceStr);
    
    if (name && !isNaN(price)) {
      // Clean name formatting
      name = name.replace(/\s+/g, ' ');
      items.push({ code, name, price });
    }
  }
  return items;
}

const listM = parseHtmlProducts('Offer list m.HTM.html');
const listSI = parseHtmlProducts('Offer list s.i.HTM.html');

console.log('List M count:', listM.length);
console.log('List SI count:', listSI.length);

// Merge products uniquely by name
const productMap = new Map();

[...listM, ...listSI].forEach(item => {
  const key = item.name.toUpperCase();
  if (!productMap.has(key)) {
    productMap.set(key, item);
  }
});

const allProducts = Array.from(productMap.values());
console.log('Total Unique Products Extracted:', allProducts.length);
console.log('Sample parsed products:', allProducts.slice(0, 10));

// Write a clean parsed JS module
const jsOutput = `// Parsed catalog from official offer lists
export const REAL_CATALOG = ${JSON.stringify(allProducts, null, 2)};
`;

fs.writeFileSync('src/parsedCatalog.js', jsOutput, 'utf8');
console.log('Saved src/parsedCatalog.js successfully!');
