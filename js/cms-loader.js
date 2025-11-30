// Parse frontmatter from markdown
function parseMarkdown(md) {
  const separator = '---';
  const parts = md.split(separator);

  if (parts.length < 3) return null;

  const yaml = parts[1].trim();
  const body = parts.slice(2).join(separator).trim();

  const data = jsyaml.load(yaml);

  return { data, body };
}

// Fetch all markdown files from a folder
async function loadCollection(folder) {
  const res = await fetch(`/content/${folder}/`);
  
  // Netlify exposes folder listing via API only when published on Netlify
  // For dev: fallback to manual file listing
  if (!res.ok) {
    console.warn(`Unable to list ${folder}`);
    return [];
  }

  const text = await res.text();
  const links = [...text.matchAll(/href="([^"]+\.md)"/g)].map(x => x[1]);

  const items = [];

  for (let file of links) {
    const fileRes = await fetch(`/content/${folder}/${file}`);
    const md = await fileRes.text();
    const parsed = parseMarkdown(md);
    if (parsed) items.push(parsed);
  }

  return items;
}

// Public API helpers
async function loadCalendar() {
  return await loadCollection("calendar");
}

async function loadGalleries() {
  return await loadCollection("galleries");
}

window.CMSLoader = { loadCalendar, loadGalleries };
