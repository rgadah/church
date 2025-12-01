// generator.js - Final script using your proven manual parsing logic

const fs = require('fs');
const path = require('path');

// --- Core Utility Functions (Identical to your provided working script) ---

// Utility: Normalize image paths and strip quotes from values
function cleanValue(value) {
    if (!value) return '';

    value = String(value);
    
    // 1. Strip starting/ending quotes (', ")
    value = value.replace(/^['"](.*)['"]$/, '$1');

    // 2. Ensure image paths are absolute (start with /)
    if (value.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
        return value.startsWith('/') ? value : '/' + value;
    }

    return value;
}

// Manual Parser for YAML-style frontmatter
function parseFrontMatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) return { body: content };

    const yaml = match[1]; 
    const body = match[2]; 
    const data = {};

    const lines = yaml.split('\n');

    let currentListKey = null;
    let listItems = []; 

    lines.forEach(line => {
        // 1. Handle list items (lines starting with - )
        if (line.trim().startsWith('- ')) {
            if (currentListKey) {
                listItems.push(cleanValue(line.replace('- ', '').trim()));
            }
            return;
        }

        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join(':').trim();

            // 2. Check for a list key (e.g., 'carousel:' or 'gallery:')
            if (value === '' && !value.startsWith('"')) {
                currentListKey = key;
                listItems = [];
                data[key] = listItems;
                return;
            }

            // 3. For standard key: value pairs
            currentListKey = null;
            data[key] = cleanValue(value);
        }
    });

    // Clean common image fields
    if (data.image) data.image = cleanValue(data.image);
    if (data.featured_image) data.featured_image = cleanValue(data.featured_image);
    if (Array.isArray(data.gallery)) data.gallery = data.gallery.map(cleanValue);

    return { ...data, body: body.trim() }; 
}

// --- End of Core Utility Functions ---


// Read all markdown files in a folder
function loadCollection(folderPath) {
    const folder = path.join(__dirname, folderPath);
    if (!fs.existsSync(folder)) return [];

    const files = fs.readdirSync(folder).filter(f => f.endsWith('.md'));
    const items = [];

    for (let filename of files) {
        const fullPath = path.join(folder, filename);
        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsed = parseFrontMatter(content);

            if (Object.keys(parsed).length > 1) { 
                items.push({
                    ...parsed,
                    filename,
                });
            }
        } catch (e) {
            console.error(`Error processing file ${filename}:`, e.message);
        }
    }

    return items;
}

// Write JSON file for frontend consumption
function generateJSON(outputFile, folderPath) {
    const items = loadCollection(folderPath);

    // FIX for ENOENT: Ensure the output directory (e.g., 'public') exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify(items, null, 2));
    console.log(`✔ Generated ${path.basename(outputFile)} with ${items.length} entries from ${folderPath}`);
}

// Execution for the current project's collections
generateJSON(path.join(__dirname, 'public', 'calendar.json'), 'content/calendar');
generateJSON(path.join(__dirname, 'public', 'galleries.json'), 'content/galleries');