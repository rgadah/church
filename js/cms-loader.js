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

  if (data.featured_image)
    data.featured_image = cleanValue(data.featured_image);

  if (Array.isArray(data.gallery))
    data.gallery = data.gallery.map(cleanValue);

  return { ...data, body };
}

// Fetch markdown files inside a Netlify-published folder
async function loadCollection(folder) {
  let res;

  try {
    res = await fetch(`/content/${folder}/`);
  } catch (e) {
    console.warn(`Cannot fetch folder listing for ${folder}`);
    return [];
  }

  if (!res.ok) {
    console.warn(`Unable to list folder: ${folder}`);
    return [];
  }

  const text = await res.text();

  // Netlify exposes directory indexes — capture ".md" links
  const links = [...text.matchAll(/href="([^"]+\.md)"/g)].map(x => x[1]);

  const items = [];

  for (let filename of links) {
    try {
      const fileRes = await fetch(`/content/${folder}/${filename}`);
      const md = await fileRes.text();
      const parsed = parseMarkdown(md);

      if (parsed) {
        items.push({
          ...parsed,
          filename, // match Node output
        });
      }
    } catch (err) {
      console.warn(`Failed parsing ${filename}`, err);
    }
  }

  return items;
}

// Public API
async function loadCalendar() {
  return await loadCollection("calendar");
}

async function loadGalleries() {
  return await loadCollection("galleries");
}

window.CMSLoader = { loadCalendar, loadGalleries };
