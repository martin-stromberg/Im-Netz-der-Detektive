(async function () {
  const navEl = document.getElementById('nav');
  const docEl = document.getElementById('doc');
  const progressBar = document.getElementById('progress-bar');
  const progressCount = document.getElementById('progress-count');
  const titleEl = document.getElementById('project-title');

  marked.setOptions({ gfm: true, breaks: false });

  let manifest;
  try {
    manifest = await (await fetch('content/manifest.json')).json();
  } catch (e) {
    docEl.innerHTML = '<p class="error">manifest.json konnte nicht geladen werden. ' +
      'Bitte die Seite über einen lokalen Server öffnen (z. B. <code>python -m http.server</code>), nicht per file://.</p>';
    return;
  }

  if (manifest.project) titleEl.textContent = manifest.project;

  // Navigation aufbauen
  manifest.docs.forEach((d, i) => {
    const a = document.createElement('a');
    a.href = '#/' + d.file;
    a.innerHTML = '<span class="nav-num">' + String(i).padStart(2, '0') + '</span>' + d.title;
    a.dataset.file = d.file;
    navEl.appendChild(a);
  });

  async function loadDoc(file) {
    docEl.innerHTML = '<p class="loading">Lade …</p>';
    try {
      const res = await fetch('content/' + file);
      if (!res.ok) throw new Error(res.status);
      const md = await res.text();
      docEl.innerHTML = DOMPurify.sanitize(marked.parse(md));
    } catch (e) {
      docEl.innerHTML = '<p class="error">Dokument „' + file + '" konnte nicht geladen werden.</p>';
    }
    navEl.querySelectorAll('a').forEach(a =>
      a.classList.toggle('active', a.dataset.file === file));
    window.scrollTo(0, 0);
  }

  function route() {
    const file = location.hash.replace('#/', '') || manifest.docs[0].file;
    loadDoc(file);
  }

  window.addEventListener('hashchange', route);
  route();

  // Fortschritt: Checkboxen über alle Docs zählen
  let open = 0, done = 0;
  await Promise.all(manifest.docs.map(async d => {
    const md = await (await fetch('content/' + d.file)).text();
    open += (md.match(/^- \[ \]/gm) || []).length;
    done += (md.match(/^- \[x\]/gim) || []).length;
  }));
  const total = open + done;
  if (total > 0) {
    progressBar.style.width = Math.round(done / total * 100) + '%';
    progressCount.textContent = done + ' / ' + total;
  } else {
    progressCount.textContent = '–';
  }
})();
