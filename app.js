import { sourcesData } from './data/sources.js';
import {
  promptMetadata,
  promptVerdicts,
  promptSteps,
  rawElectoralPrompt
} from './data/promptData.js';

function initApp() {
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
  initGeminiDynamicTutorial();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


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
    const displayDate = /^\d{4}-\d{2}-\d{2}$/.test(promptMetadata.lastUpdated)
      ? promptMetadata.lastUpdated.split('-').reverse().join('/')
      : promptMetadata.lastUpdated;
    versionBadge.textContent = `v${promptMetadata.version} (${displayDate})`;
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
    copyToClipboard(rawElectoralPrompt, '¡Prompt copiado al portapapeles! Listo para usar en tu IA.');
  };

  if (mainCopyBtn) mainCopyBtn.addEventListener('click', handleCopy);
  if (heroCopyBtn) heroCopyBtn.addEventListener('click', handleCopy);

  const pluginPromptBtn = document.getElementById('btn-copy-plugin-prompt');
  if (pluginPromptBtn) {
    pluginPromptBtn.addEventListener('click', () => {
      const fullText = `@Plugin Creator, ayúdame a crear un complemento con el siguiente prompt:\n\n${rawElectoralPrompt}`;
      copyToClipboard(fullText, '¡Orden y prompt copiados! Pégalos directamente en el chat con @Plugin Creator.');
    });
  }
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
      },
      {
        id: 'multimodal',
        title: 'Protocolo de Auditoría Multimodal (Vídeo, Audio y Virales)',
        desc: 'Reglas contra falso peritaje acústico, controversia acústica en ruido de fondo y prevención de deepfakes y cheapfakes.',
        test: () => searchUser.includes('multimodal') || searchUser.includes('peritaje ac') || searchUser.includes('controversia ac')
      },
      {
        id: 'jurisdiccional',
        title: 'Extensión Jurisdiccional y Territorial Obligatoria',
        desc: 'Obligación de rastrear boletines autonómicos/forales y prensa regional de referencia ante controversias territoriales.',
        test: () => searchUser.includes('extensi') && (searchUser.includes('jurisdiccional') || searchUser.includes('territorial'))
      },
      {
        id: 'coaccion_indirecta',
        title: 'Coacción Indirecta, Asfixia Financiera y Efecto Desaliento',
        desc: 'Fiscalización de asfixia económica con dinero público, discrecionalidad en subvenciones (arts. 9.3 y 14 CE) y distinción entre censura formal y material desde el Turno 1.',
        test: () => searchUser.includes('coacci') || searchUser.includes('efecto desaliento') || searchUser.includes('chilling effect') || searchUser.includes('asfixia financiera')
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
        copyToClipboard(rawElectoralPrompt, `¡Prompt oficial v${promptMetadata.version} copiado! Listo para actualizar en tu Gem o GPT.`);
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

function initGeminiDynamicTutorial() {
  const container = document.getElementById('gemini-tutorial-dynamic-area');
  if (!container) return;

  const noticeElement = document.getElementById('gemini-migration-notice');
  const noticeIcon = document.getElementById('gemini-notice-icon');
  const noticeTitle = document.getElementById('gemini-notice-title');
  const noticeBadge = document.getElementById('gemini-notice-badge');
  const noticeDesc = document.getElementById('gemini-notice-desc');
  const toggleBtn = document.getElementById('btn-toggle-gemini-preview');

  const heroIcon = document.getElementById('gemini-hero-icon');
  const heroTitle = document.getElementById('gemini-hero-title');
  const heroDesc = document.getElementById('gemini-hero-desc');

  const step1Title = document.getElementById('gemini-step-1-title');
  const step1Desc = document.getElementById('gemini-step-1-desc');
  const step2Title = document.getElementById('gemini-step-2-title');
  const step2Desc = document.getElementById('gemini-step-2-desc');
  const step3Title = document.getElementById('gemini-step-3-title');
  const step3Desc = document.getElementById('gemini-step-3-desc');
  const step4Title = document.getElementById('gemini-step-4-title');
  const step4Desc = document.getElementById('gemini-step-4-desc');

  const MIGRATION_DATE = new Date('2026-11-17T00:00:00Z');

  function render(isSkillsMode) {
    if (isSkillsMode) {
      if (noticeElement) noticeElement.classList.add('migrated');
      if (noticeIcon) noticeIcon.textContent = '🚀';
      if (noticeTitle) noticeTitle.textContent = 'Actualización oficial: Gemini Habilidades (Skills)';
      if (noticeBadge) {
        noticeBadge.textContent = 'Ecosistema Activo';
        noticeBadge.style.color = '#10b981';
        noticeBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      }
      if (noticeDesc) {
        noticeDesc.innerHTML = 'Google ha completado la migración de Gems a <strong>Habilidades (Skills)</strong>. Si tenías un Gem configurado previamente, se ha transferido automáticamente a tu cuenta. Ahora puedes invocar la fiscalización directamente en cualquier conversación activa escribiendo <code>@</code> seguido del nombre de tu habilidad o con <code>/</code>.';
      }
      if (toggleBtn) toggleBtn.textContent = '↩️ Ver Tutorial Clásico (Gems)';

      if (heroIcon) heroIcon.textContent = '🧩';
      if (heroTitle) heroTitle.textContent = '¿Por qué las Habilidades de Gemini son la opción recomendada?';
      if (heroDesc) {
        heroDesc.innerHTML = 'Las <strong>Habilidades de Gemini</strong> permiten activar al fiscalizador cívico de forma modular dentro de cualquier conversación cotidiana (escribiendo <em>@</em> y el nombre de tu habilidad o con <em>/</em>) sin necesidad de abrir chats aislados. Mantienen toda la potencia de navegación web de Google para contrastar hemerotecas, leyes oficiales y datos en tiempo real.';
      }

      if (step1Title) step1Title.textContent = 'Abre Habilidades de Gemini';
      if (step1Desc) {
        step1Desc.innerHTML = 'Inicia sesión en <a href="https://gemini.google.com/skills" target="_blank" rel="noopener noreferrer">gemini.google.com/skills</a> (o accede desde <strong>Ajustes → Habilidades</strong> en el panel lateral).';
      }
      if (step2Title) step2Title.textContent = 'Crea una Habilidad';
      if (step2Desc) {
        step2Desc.innerHTML = 'Pulsa en <strong>«Crear habilidad»</strong> (o <em>Create manually</em>) y nómbrala con el identificador que prefieras (por ejemplo <code>fiscalizador-electoral</code>).';
      }
      if (step3Title) step3Title.textContent = 'Pega las Instrucciones';
      if (step3Desc) {
        step3Desc.innerHTML = 'Pulsa en <strong>«Copiar Prompt»</strong> y pega el texto íntegro en las directrices de la habilidad. Guarda los cambios.';
      }
      if (step4Title) step4Title.textContent = 'Invoca en Cualquier Chat';
      if (step4Desc) {
        step4Desc.innerHTML = 'Escribe <strong>@</strong> seguido del nombre que le diste a tu habilidad o pulsa <strong>/</strong> en cualquier conversación de Gemini para auditar afirmaciones políticas sin salir del chat.';
      }
    } else {
      if (noticeElement) noticeElement.classList.remove('migrated');
      if (noticeIcon) noticeIcon.textContent = '⏳';
      if (noticeTitle) noticeTitle.textContent = 'Evolución programada: De Gems a Habilidades (Skills)';
      if (noticeBadge) {
        noticeBadge.textContent = '17 Nov 2026';
        noticeBadge.style.color = '';
        noticeBadge.style.background = '';
      }
      if (noticeDesc) {
        noticeDesc.innerHTML = 'A partir del 17/11/2026, Google migrará automáticamente todos los Gems a Habilidades (Skills). Si creas tu Gem hoy siguiendo este tutorial, se convertirá solo en una habilidad sin perder nada y podrás usarlo en cualquier chat escribiendo <code>@</code> seguido del nombre que le hayas asignado.';
      }
      if (toggleBtn) toggleBtn.textContent = '👁️ Previsualizar Habilidades';

      if (heroIcon) heroIcon.textContent = '💎';
      if (heroTitle) heroTitle.textContent = '¿Por qué Gemini Gems es la plataforma recomendada?';
      if (heroDesc) {
        heroDesc.innerHTML = 'El prompt fue concebido y probado originalmente en <strong>Gemini Gems</strong>, donde demostró una eficacia sobresaliente. Al disponer del motor de búsqueda web en directo de Google y capacidad para inspeccionar fuentes primarias oficiales, registros normativos y datos estructurados en tiempo real, contrasta promesas políticas con hipervínculos exactos y sin alucinaciones.';
      }

      if (step1Title) step1Title.textContent = 'Abre Gemini Gems';
      if (step1Desc) {
        step1Desc.innerHTML = 'Inicia sesión con tu cuenta de Google en <a href="https://gemini.google.com/gems/view" target="_blank" rel="noopener noreferrer">gemini.google.com/gems/view</a> o desde el menú lateral.';
      }
      if (step2Title) step2Title.textContent = 'Crea un "Nuevo Gem"';
      if (step2Desc) {
        step2Desc.innerHTML = 'Haz clic en <strong>"+ Nuevo Gem"</strong> (o <em>"Crear habilidades"</em> si tu cuenta ya tiene la nueva interfaz) y nómbralo <em>Fiscalizador Electoral España</em>.';
      }
      if (step3Title) step3Title.textContent = 'Pega las Instrucciones';
      if (step3Desc) {
        step3Desc.innerHTML = 'Pulsa en <strong>«Copiar Prompt»</strong> y pega el texto íntegro en el campo de <em>Instrucciones</em> del Gem.';
      }
      if (step4Title) step4Title.textContent = 'Guarda y Fiscaliza';
      if (step4Desc) {
        step4Desc.innerHTML = 'Guarda los cambios. Tendrás tu auditor cívico siempre disponible en el menú lateral de Gemini listo para responder.';
      }
    }
  }

  const storedPreference = sessionStorage.getItem('gemini-tutorial-preview-mode');
  let isSkillsMode = storedPreference ? storedPreference === 'skills' : (new Date() >= MIGRATION_DATE);

  render(isSkillsMode);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isSkillsMode = !isSkillsMode;
      sessionStorage.setItem('gemini-tutorial-preview-mode', isSkillsMode ? 'skills' : 'gems');
      render(isSkillsMode);
      showToast(isSkillsMode ? 'Previsualizando tutorial de Habilidades (Skills)' : 'Tutorial clásico de Gemini Gems cargado');
    });
  }
}
