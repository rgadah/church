// generator.js
const fs = require('fs');
const path = require('path');
const jsyaml = require('js-yaml');

// Utility: Normalize image + string values
function cleanValue(value) {
  if (!value) return '';

  value = String(value).replace(/^['"](.*)['"]$/, '$1'); // strip quotes

  if (value.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    return value.startsWith('/') ? value : '/' + value;
  }

  return value;
}

// Parse YAML frontmatter safely
function parseMarkdown(md) {
  const match = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

  if (!match) return null;

  const yaml = match[1];
  const body = match[2];

  let data = {};

  try {
    data = jsyaml.load(yaml) || {};
  } catch (e) {
    console.warn("YAML parse error:", e);
  }

  // Clean image fields like in your Node script
  if (data.image) data.image = cleanValue(data.image);
  if (data.featured_image) data.featured_image = cleanValue(data.featured_image);
  if (Array.isArray(data.gallery)) data.gallery = data.gallery.map(cleanValue);

  return { ...data, body };
}

// Read all markdown files in a folder
function loadCollection(folderPath) {
  const folder = path.join(__dirname, folderPath);
  if (!fs.existsSync(folder)) return [];

  const files = fs.readdirSync(folder).filter(f => f.endsWith('.md'));
  const items = [];

  for (let filename of files) {
    const fullPath = path.join(folder, filename);
    const md = fs.readFileSync(fullPath, 'utf-8');
    const parsed = parseMarkdown(md);

    if (parsed) {
      items.push({
        ...parsed,
        filename,
      });
    }
  }

  return items;
}

// Write JSON file for frontend consumption
function generateJSON(outputFile, folderPath) {
  const items = loadCollection(folderPath);
  fs.writeFileSync(outputFile, JSON.stringify(items, null, 2));
  console.log(`Generated ${outputFile} with ${items.length} items from ${folderPath}`);
}

// Example usage
generateJSON(path.join(__dirname, 'public', 'calendar.json'), 'content/calendar');
generateJSON(path.join(__dirname, 'public', 'galleries.json'), 'content/galleries');
