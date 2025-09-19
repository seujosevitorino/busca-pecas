let DATA = [];
let resultados = [];
const byId = (id) => document.getElementById(id);

function normalize(s){ return (s||'').toString().toLowerCase().trim(); }

async function loadData(){
  try{
    const res = await fetch('dados.json', {cache:'reload'});
    DATA = await res.json();
    // cria campo normalizado e garante chaves
    DATA = DATA.map(r => ({
      'Descrição da Peça': r['Descrição da Peça'] ?? r['descricao'] ?? '',
      'Código do Mercado': r['Código do Mercado'] ?? r['codigo'] ?? '',
      'Descricao_normalizada': normalize(r['Descrição da Peça'] ?? r['descricao'])
    }));
  }catch(e){
    console.error('Erro carregando dados:', e);
    alert('Não foi possível carregar os dados. Verifique o arquivo dados.json.');
  }
}

function search(){
  const t1 = normalize(byId('termo1').value);
  const t2 = normalize(byId('termo2').value);
  let res = DATA;
  if(t1) res = res.filter(r => r.Descricao_normalizada.includes(t1));
  if(t2) res = res.filter(r => r.Descricao_normalizada.includes(t2));

  // remove duplicatas por descrição normalizada
  const seen = new Set();
  resultados = [];
  for(const r of res){
    const k = r.Descricao_normalizada;
    if(!seen.has(k)){ seen.add(k); resultados.push(r); }
  }
  render();
}

function resetAll(){
  byId('termo1').value = '';
  byId('termo2').value = '';
  resultados = [];
  byId('codigo').value = '';
  byId('descricao').value = '';
  byId('contador').textContent = 'Quantidade de peças localizadas: 0';
  byId('results').innerHTML = '';
}

function pick(idx){
  const r = resultados[idx];
  byId('codigo').value = r['Código do Mercado'] || '';
  byId('descricao').value = r['Descrição da Peça'] || '';
}

async function copiarCodigo(){
  const txt = byId('codigo').value || '';
  try{
    await navigator.clipboard.writeText(txt);
    alert('Código copiado');
  }catch(e){
    const input = byId('codigo');
    input.focus(); input.select();
    alert('Selecione e copie o código manualmente.');
  }
}

function render(){
  const cont = byId('contador');
  cont.textContent = 'Quantidade de peças localizadas: ' + resultados.length;
  const root = byId('results');
  root.innerHTML = '';
  resultados.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'card';
    const left = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = r['Descrição da Peça'] || '';
    const code = document.createElement('div');
    code.className = 'badge';
    code.textContent = 'Código: ' + (r['Código do Mercado'] || '—');
    left.appendChild(title);
    left.appendChild(code);
    const btn = document.createElement('button');
    btn.textContent = 'Selecionar';
    btn.addEventListener('click', () => pick(i));
    div.appendChild(left);
    div.appendChild(btn);
    root.appendChild(div);
  });
}

function bindUI(){
  byId('buscar').addEventListener('click', search);
  byId('limpar').addEventListener('click', resetAll);
  byId('copiar').addEventListener('click', copiarCodigo);
  byId('termo1').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ search(); }});
  byId('termo2').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ search(); }});
}

window.addEventListener('load', async () => {
  bindUI();
  await loadData();
  if ('serviceWorker' in navigator) {
    try{ await navigator.serviceWorker.register('service-worker.js'); }catch(e){ console.log(e); }
  }
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = byId('installBtn');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    btn.hidden = true;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  });
});
