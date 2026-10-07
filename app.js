import { sourcesData } from './data/sources.js';
import {
  promptMetadata,
  promptVerdicts,
  promptSteps,
  rawElectoralPrompt
} from './data/promptData.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderPromptViewer();
  renderSteps();
  renderVerdicts();
  initSourcesDirectory();
  initTabs();
  initAccordions();
  initCopyActions();
  initGitHubLinks();
  initPromptComparator();
});


function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme-preference');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');

  setTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      localStorage.setItem('theme-preference', newTheme);
    });
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage);
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(successMessage);
  }
}

function renderPromptViewer() {
  const codeViewer = document.getElementById('prompt-code-viewer');
  if (codeViewer) {
    codeViewer.textContent = rawElectoralPrompt;
  }
  const versionBadge = document.getElementById('prompt-version-badge');
  if (versionBadge) {
    versionBadge.textContent = `v${promptMetadata.version} (${promptMetadata.lastUpdated})`;
  }
}

function renderSteps() {
  const container = document.getElementById('steps-container');
  if (!container) return;

  container.innerHTML = promptSteps.map(item => `
    <article class="step-card">
      <div class="step-number">${item.step}</div>
      <h4>${item.title}</h4>
      <p>${item.desc}</p>
    </article>
  `).join('');
}

function renderVerdicts() {
  const container = document.getElementById('verdicts-container');
  if (!container) return;

  container.innerHTML = promptVerdicts.map(item => `
    <div class="verdict-chip" style="border-left: 3px solid ${item.color};">
      <div class="verdict-header">
        <span>${item.icon}</span>
        <span>${item.label}</span>
      </div>
      <div class="verdict-desc">${item.desc}</div>
    </div>
  `).join('');
}

function initSourcesDirectory() {
  const grid = document.getElementById('sources-grid');
  const searchInput = document.getElementById('sources-search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');

  let currentCategory = 'all';
  let searchQuery = '';

  function renderFilteredSources() {
    if (!grid) return;

    const filtered = sourcesData.filter(source => {
      const matchesCategory = currentCategory === 'all' || source.levelCategory === currentCategory;
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const matchesSearch = !normalizedQuery ||
        source.name.toLowerCase().includes(normalizedQuery) ||
        source.description.toLowerCase().includes(normalizedQuery) ||
        source.whyUseful.toLowerCase().includes(normalizedQuery) ||
        source.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-sources">
          <h3>No se encontraron fuentes</h3>
          <p>Prueba con otros términos de búsqueda o selecciona otra categoría.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(source => `
      <article class="source-card">
        <div class="source-card-top">
          <span class="source-level-tag">${source.level} · ${source.levelName}</span>
          <h3 class="source-title">${source.name}</h3>
          <p class="source-desc">${source.description}</p>
          <div class="source-utility">
            <strong>Utilidad para la IA:</strong> ${source.whyUseful}
          </div>
          <div class="source-tags">
            ${source.tags.map(tag => `<span class="source-tag">#${tag}</span>`).join('')}
          </div>
        </div>
        <a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link-btn">
          Visitar portal oficial ↗
        </a>
      </article>
    `).join('');
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderFilteredSources();
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category') || 'all';
      renderFilteredSources();
    });
  });

  renderFilteredSources();
}

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const views = document.querySelectorAll('.prompt-content-view');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.add('active');
      }
    });
  });
}

function initAccordions() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isOpen = content.classList.contains('open');
      document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('open'));
      if (!isOpen) {
        content.classList.add('open');
      }
    });
  });
}

function initCopyActions() {
  const mainCopyBtn = document.getElementById('btn-copy-prompt');
  const heroCopyBtn = document.getElementById('hero-copy-prompt');

  const handleCopy = () => {
    copyToClipboard(rawElectoralPrompt, '¡Prompt copiado al portapapeles! Listo para pegar en Gemini o ChatGPT.');
  };

  if (mainCopyBtn) mainCopyBtn.addEventListener('click', handleCopy);
  if (heroCopyBtn) heroCopyBtn.addEventListener('click', handleCopy);
}

function initGitHubLinks() {
  const sourceIssueBtn = document.getElementById('btn-issue-source');
  const promptIssueBtn = document.getElementById('btn-issue-prompt');
  const brokenIssueBtn = document.getElementById('btn-issue-broken');
  const webIssueBtn = document.getElementById('btn-issue-web');
  const repoLink = document.getElementById('repo-link');
  const footerRepoLink = document.getElementById('footer-repo-link');

  const { repoUrl, newIssueUrl } = promptMetadata.github;

  if (repoLink) repoLink.href = repoUrl;
  if (footerRepoLink) footerRepoLink.href = repoUrl;

  if (sourceIssueBtn) {
    sourceIssueBtn.href = `${newIssueUrl}?template=01_fuente_nueva.md&labels=fuente-nueva`;
  }

  if (promptIssueBtn) {
    promptIssueBtn.href = `${newIssueUrl}?template=02_mejora_prompt.md&labels=mejora-prompt`;
  }

  if (brokenIssueBtn) {
    brokenIssueBtn.href = `${newIssueUrl}?template=03_enlace_caido.md&labels=enlace-caido`;
  }

  if (webIssueBtn) {
    webIssueBtn.href = `${newIssueUrl}?template=04_mejora_web.md&labels=mejora-web`;
  }
}

function initPromptComparator() {
  const textarea = document.getElementById('user-prompt-input');
  const runBtn = document.getElementById('btn-run-compare');
  const clearBtn = document.getElementById('btn-clear-compare');
  const sampleBtn = document.getElementById('btn-sample-compare');
  const resultArea = document.getElementById('compare-result-area');

  if (!textarea || !runBtn || !resultArea) return;

  const normalize = (str) => {
    if (!str) return '';
    return str
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  const cleanForSearch = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9áéíóúüñ]/gi, ' ');
  };

  const runComparison = () => {
    const rawUser = textarea.value;
    if (!rawUser.trim()) {
      showToast('⚠️ Pega primero el texto de tu prompt para compararlo.');
      textarea.focus();
      return;
    }

    const normUser = normalize(rawUser);
    const normOfficial = normalize(rawElectoralPrompt);

    resultArea.style.display = 'block';

    if (normUser === normOfficial) {
      resultArea.innerHTML = `
        <div class="compare-result-card status-identical">
          <div class="compare-header-row">
            <div class="compare-status-title" style="color: #10b981;">
              <span>✅</span>
              <span>¡Tu prompt está 100% actualizado!</span>
            </div>
            <span class="compare-badge success">Versión Oficial v${promptMetadata.version}</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0;">
            No se han encontrado diferencias de contenido ni novedades pendientes. Las instrucciones que usas en tu IA coinciden exactamente con la última versión de la web oficial. ¡No necesitas hacer nada!
          </p>
        </div>
      `;
      showToast('✅ ¡Tu prompt está 100% al día con la web!');
      return;
    }

    // Detect missing features or novelties in the user's prompt
    const searchUser = cleanForSearch(rawUser);

    const featureChecks = [
      {
        id: 'regcon',
        title: 'Registro de Convenios Colectivos (REGCON)',
        desc: 'Auditoría de convenios laborales oficiales y tablas salariales del Ministerio de Trabajo.',
        test: () => searchUser.includes('regcon') || searchUser.includes('convenios colectivos')
      },
      {
        id: 'bdns',
        title: 'Base de Datos Nacional de Subvenciones (BDNS)',
        desc: 'Fiscalización de dinero público y subvenciones concedidas a sindicatos, partidos y patronales.',
        test: () => searchUser.includes('bdns') || searchUser.includes('publicidad de subvenciones')
      },
      {
        id: 'follow_the_money',
        title: 'Regla "Follow the Money"',
        desc: 'Verificación de licitación real y partidas presupuestarias en la Plataforma de Contratación.',
        test: () => searchUser.includes('follow the money') || searchUser.includes('licitaci')
      },
      {
        id: 'blowback',
        title: 'Regla "Blowback" (Desfase Burocrático)',
        desc: 'Distinción entre anuncio público, aprobación legal y aplicación material en la calle.',
        test: () => searchUser.includes('blowback') || searchUser.includes('desfase burocr')
      },
      {
        id: 'cherry_picking',
        title: 'Filtro Anti-Cherry-Picking Estadístico',
        desc: 'Obligación de consultar series temporales largas en el INE para neutralizar datos aislados.',
        test: () => searchUser.includes('cherry picking') || searchUser.includes('series temporales')
      },
      {
        id: 'framing',
        title: 'Auditoría de Encuadre Mediático (Framing)',
        desc: 'Comparación cruzada de portadas de medios de líneas opuestas para detectar omisiones.',
        test: () => searchUser.includes('framing') || searchUser.includes('encuadre') || searchUser.includes('cortinas de humo')
      },
      {
        id: 'congreso_mano',
        title: 'El Congreso en tu Mano & Radares de Voto',
        desc: 'Rastreo de votaciones nominales por diputado y grupo en actas del Parlamento.',
        test: () => searchUser.includes('congreso en tu mano') || searchUser.includes('votaciones nominales')
      },
      {
        id: 'jmail',
        title: 'Archivos Desclasificados (Jmail.world)',
        desc: 'Acceso a registros judiciales y desclasificaciones de comisiones del Congreso.',
        test: () => searchUser.includes('jmail')
      },
      {
        id: 'verdicts_colors',
        title: 'Sistema de Veredictos Visuales (6 Veredictos)',
        desc: 'Clasificación cromática estricta (🟢 Cumplido, 🔵 No atribuible, 🟡 Parcial, 🟠 No demostrado, 🔴 Falso/Bulo, ⚪ Sin datos).',
        test: () => searchUser.includes('cumplido') && searchUser.includes('bulo') && (rawUser.includes('🟢') || searchUser.includes('veredicto'))
      }
    ];

    const novelties = featureChecks.filter(f => !f.test());

    // Approximate similarity based on line matching
    const officialLines = normOfficial.split('\n').filter(l => l.length > 20);
    let matchedLines = 0;
    officialLines.forEach(line => {
      const simplified = cleanForSearch(line.slice(0, 50));
      if (searchUser.includes(simplified)) matchedLines++;
    });
    const similarityScore = Math.max(10, Math.min(98, Math.round((matchedLines / officialLines.length) * 100)));

    let noveltiesHtml = '';
    if (novelties.length > 0) {
      noveltiesHtml = `
        <div style="margin-top: 1rem;">
          <strong style="color: var(--text-primary); font-size: 0.92rem; display: block; margin-bottom: 0.5rem;">
            ✨ Novedades y reglas de la versión web oficial ausentes en tu texto:
          </strong>
          <div class="compare-novelties-list">
            ${novelties.map(item => `
              <div class="compare-novelty-item">
                <strong>+ ${item.title}:</strong> ${item.desc}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      noveltiesHtml = `
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0.75rem 0;">
          Tu texto incluye la estructura general, pero contiene diferencias de redacción o parámetros frente a la versión canónica actual.
        </p>
      `;
    }

    resultArea.innerHTML = `
      <div class="compare-result-card status-different">
        <div class="compare-header-row">
          <div class="compare-status-title" style="color: #f59e0b;">
            <span>⚠️</span>
            <span>Tu prompt difiere de la versión oficial web</span>
          </div>
          <span class="compare-badge warning">Similitud estimada: ${similarityScore}%</span>
        </div>

        <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0;">
          La versión web oficial incluye actualizaciones metodológicas y fuentes de verificación que tu Gem o GPT no tiene actualmente.
        </p>

        ${noveltiesHtml}

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
          <button id="btn-copy-latest-from-diff" class="btn btn-primary" type="button">
            📋 Copiar Versión Oficial Actualizada (v${promptMetadata.version})
          </button>
          <span style="font-size: 0.82rem; color: var(--text-secondary);">
            Copia el texto oficial y sustitúyelo en las instrucciones de tu IA para disfrutar de todas las novedades.
          </span>
        </div>
      </div>
    `;

    const copyFromDiffBtn = document.getElementById('btn-copy-latest-from-diff');
    if (copyFromDiffBtn) {
      copyFromDiffBtn.addEventListener('click', () => {
        copyToClipboard(rawElectoralPrompt, '¡Prompt oficial v1.0.0 copiado! Listo para actualizar en tu Gem o GPT.');
      });
    }
  };

  runBtn.addEventListener('click', runComparison);

  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    resultArea.style.display = 'none';
    resultArea.innerHTML = '';
    textarea.focus();
  });

  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      textarea.value = `# GEM FISCALIZADOR ELECTORAL (Versión Antigua sin actualizar)
Eres un fiscalizador cívico independiente. Tu función es contrastar promesas electorales y declaraciones de partidos en España.
- Consulta el BOE y diarios de sesiones del Congreso de los Diputados.
- Comprueba si lo prometido se ha votado a favor o en contra.
- Utiliza Maldita y Newtral para bulos.`;
      runComparison();
    });
  }
}
