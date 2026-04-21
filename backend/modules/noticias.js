// backend/modules/noticias.js
// Módulo de noticias: scraping de Infobae, El Mundo y WIRED en Español

const axios = require('axios');
const cheerio = require('cheerio');

// Palabras clave a filtrar
const KEYWORDS = ['vulnerabilidad', 'ciberseguridad', 'ia', 'inteligencia artificial', 'desarrollo web', 'hacking', 'malware', 'seguridad'];

// Fuentes de noticias
const SOURCES = [
  {
    name: 'Infobae',
    url: 'https://www.infobae.com/tecno/',
    selector: 'h2, h3',
  },
  {
    name: 'WIRED ES',
    url: 'https://es.wired.com/',
    selector: 'h2, h3',
  },
  {
    name: 'El Mundo Tecnología',
    url: 'https://www.elmundo.es/tecnologia.html',
    selector: 'h2, h3',
  }
];

/**
 * Filtra titulares según palabras clave
 */
function filterByKeyword(titles, keyword) {
  const kw = keyword.toLowerCase();
  return titles.filter(t => {
    const text = t.toLowerCase();
    // Si el keyword coincide con alguna palabra clave del sistema O con el término buscado
    return text.includes(kw) || KEYWORDS.some(k => text.includes(k));
  });
}

/**
 * Scrapea una fuente y devuelve titulares
 */
async function scrapeSite(source) {
  try {
    const { data } = await axios.get(source.url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(data);
    const titles = [];

    $(source.selector).each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20 && text.length < 200) {
        titles.push(text);
      }
    });

    return { source: source.name, titles: titles.slice(0, 20) };
  } catch (error) {
    console.error(`Error scrapeando ${source.name}:`, error.message);
    return { source: source.name, titles: [] };
  }
}

/**
 * Busca noticias por keyword en todas las fuentes
 * @param {string} keyword - Término de búsqueda (ej: "IA", "vulnerabilidad")
 */
async function fetchNews(keyword = 'IA') {
  try {
    const results = await Promise.all(SOURCES.map(s => scrapeSite(s)));

    let allNews = [];
    results.forEach(r => {
      const filtered = filterByKeyword(r.titles, keyword);
      filtered.forEach(title => {
        allNews.push({ source: r.source, title });
      });
    });

    // Si no hay resultados filtrados, devolver los primeros titulares de cada fuente
    if (allNews.length === 0) {
      results.forEach(r => {
        r.titles.slice(0, 3).forEach(title => {
          allNews.push({ source: r.source, title });
        });
      });
    }

    return { success: true, news: allNews.slice(0, 10), keyword };
  } catch (error) {
    return { success: false, error: error.message, news: [] };
  }
}

module.exports = { fetchNews };
