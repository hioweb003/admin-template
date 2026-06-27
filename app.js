/* Voter Payment System — demo data + UI logic */
(() => {
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const fmt = (n) => '₦' + Number(n).toLocaleString('en-NG');
const pad = (n, l=4) => String(n).padStart(l, '0');
const rand = (a) => a[Math.floor(Math.random()*a.length)];
const randDigits = (n) => Array.from({length:n}, () => Math.floor(Math.random()*10)).join('');
const FIRST = ['Adebola','Chinwe','Emeka','Funke','Ibrahim','Ngozi','Tunde','Aisha','Olumide','Yusuf','Blessing','Kelechi','Maryam','Segun','Tobi','Halima','Ifeoma','Damilola','Bukola','Chidi'];
const LAST  = ['Okonkwo','Adeyemi','Bello','Eze','Mohammed','Ojo','Adekunle','Obi','Suleiman','Balogun','Nwosu','Lawal','Akande','Ogundipe','Abubakar','Onyema','Adetayo','Yakubu','Iwobi','Adesanya'];
const STATES = {
  Lagos:{lgas:['Ikeja','Eti-Osa','Surulere','Alimosho','Lagos Island'],wards:['Ward A','Ward B','Ward C']},
  Abuja:{lgas:['AMAC','Bwari','Kuje','Gwagwalada'],wards:['Garki','Wuse','Asokoro']},
  Kano:{lgas:['Dala','Fagge','Gwale','Nassarawa'],wards:['Kofar Mata','Sabon Gari','Tarauni']},
  Rivers:{lgas:['Port Harcourt','Obio-Akpor','Eleme'],wards:['Mile 1','D-Line','Rumuomasi']},
  Oyo:{lgas:['Ibadan North','Ibadan South','Egbeda','Oluyole'],wards:['Bodija','Agodi','Ring Road']},
};
const BANKS = ['GTBank','Access Bank','UBA','Zenith Bank','First Bank','FCMB','Fidelity Bank'];
const OCCS = ['Trader','Civil Servant','Teacher','Farmer','Driver','Tailor','Student','Mechanic','Nurse'];
const STATUSES = ['Paid','Pending','Pending','Pending','Ineligible'];
const AMT = 15000;

/* -------- generate voters -------- */
const voters = [];
for (let i=0;i<60;i++){
  const fn = rand(FIRST), ln = rand(LAST);
  const st = rand(Object.keys(STATES));
  const lga = rand(STATES[st].lgas);
  const ward = rand(STATES[st].wards);
  const status = rand(STATUSES);
  voters.push({
    id:i+1, firstName:fn, lastName:ln, fullName:`${fn} ${ln}`,
    vin:'9'+randDigits(12), nin:randDigits(11), bvn:randDigits(11),
    phone:'080'+randDigits(8), bank:rand(BANKS), account:randDigits(10),
    state:st, lga, ward, polling:'PU/'+st.slice(0,2).toUpperCase()+'/'+pad(i+1,3),
    occupation:rand(OCCS), status, amount:AMT,
  });
}
/* -------- transactions -------- */
const txs = [];
let txId = 1000000;
voters.forEach(v => {
  if (v.status==='Paid' || (v.status==='Pending' && Math.random()<.3)) {
    const ok = v.status==='Paid';
    txs.push({
      id:'TXN-'+(++txId),
      voter:v, amount:v.amount,
      status: ok ? 'Success' : (Math.random()<.5?'Pending':'Failed'),
      date: new Date(Date.now()-Math.random()*30*86400000),
      by: rand(['Adebola O.','Chinwe N.','Tunde A.']),
    });
  }
});
txs.sort((a,b)=>b.date-a.date);

/* -------- audit -------- */
const audit = [];
const ACTIONS = ['Login','Import','Payment','View','Export'];
for (let i=0;i<25;i++){
  audit.push({
    user: rand(['Adebola Okonkwo','Chinwe Nwosu','Tunde Adekunle']),
    action: rand(ACTIONS),
    details: 'Performed action on record #'+ (1000+i),
    ip:'102.89.'+Math.floor(Math.random()*255)+'.'+Math.floor(Math.random()*255),
    ts: new Date(Date.now()-i*3600000*Math.random()*5),
  });
}
audit.sort((a,b)=>b.ts-a.ts);

/* -------- users -------- */
const sysUsers = [
  {name:'Adebola Okonkwo', email:'adebola@voterpay.gov.ng', role:'super_admin', last:'2 mins ago', active:true},
  {name:'Chinwe Nwosu',    email:'chinwe@voterpay.gov.ng',  role:'payment_officer', last:'1 hour ago', active:true},
  {name:'Tunde Adekunle',  email:'tunde@voterpay.gov.ng',   role:'auditor', last:'Yesterday', active:true},
  {name:'Maryam Bello',    email:'maryam@voterpay.gov.ng',  role:'payment_officer', last:'3 days ago', active:false},
];

/* -------- import history -------- */
const imports = [
  {date:'2026-06-20', file:'lagos_voters_q2.csv', total:1240, success:1220, dup:15, err:5, by:'Adebola O.', status:'Completed'},
  {date:'2026-06-12', file:'kano_pilot.xlsx',     total:540,  success:520,  dup:10, err:10,by:'Chinwe N.',  status:'Completed'},
  {date:'2026-06-01', file:'rivers_batch1.csv',   total:300,  success:300,  dup:0,  err:0, by:'Adebola O.', status:'Completed'},
];

/* -------- state -------- */
const ROLE_LABEL = {super_admin:'Super Admin', payment_officer:'Payment Officer', auditor:'Auditor'};
let currentRole = 'super_admin';
let currentView = 'dashboard';
let voterPage = 1;
const PAGE_SIZE = 10;

/* -------- LOGIN -------- */
$('#toggle-pass').addEventListener('click', () => {
  const el = $('#login-pass');
  el.type = el.type === 'password' ? 'text' : 'password';
});

$('#login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  currentRole = $('#login-role').value;
  $('#login-view').classList.add('d-none');
  $('#app-view').classList.remove('d-none');
  $('#role-switch').value = currentRole;
  applyRole();
  go('dashboard');
  toast(`Welcome back · ${ROLE_LABEL[currentRole]}`, 'success');
});

$('#logout-btn').addEventListener('click', () => {
  $('#app-view').classList.add('d-none');
  $('#login-view').classList.remove('d-none');
});

$('#role-switch').addEventListener('change', (e) => {
  currentRole = e.target.value;
  applyRole();
  if ($(`#nav-list li[data-view="${currentView}"]`)?.classList.contains('hidden')) go('dashboard');
  toast(`Viewing as ${ROLE_LABEL[currentRole]}`, 'info');
});

function applyRole(){
  $('#user-role').textContent = ROLE_LABEL[currentRole];
  $('#user-name').textContent = sysUsers.find(u=>u.role===currentRole)?.name || 'Demo User';
  $('#user-avatar').textContent = $('#user-name').textContent.split(' ').map(p=>p[0]).join('').slice(0,2);
  $$('#nav-list li').forEach(li => {
    const roles = li.dataset.role;
    if (!roles) { li.classList.remove('hidden'); return; }
    li.classList.toggle('hidden', !roles.split(',').includes(currentRole));
  });
}

/* -------- NAV -------- */
$('#nav-list').addEventListener('click', e => {
  const li = e.target.closest('li'); if (!li) return;
  go(li.dataset.view);
});

$('#closesidebar').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

$('#sidebar-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]'); if (a){ e.preventDefault(); go(a.dataset.go); }
});



function go(view){
  currentView = view;
  $$('#nav-list li').forEach(li => li.classList.toggle('active', li.dataset.view===view));
  $$('.view').forEach(v => v.classList.add('d-none'));
  $(`#view-${view}`).classList.remove('d-none');
  const label = $(`#nav-list li[data-view="${view}"] span`)?.textContent || 'Dashboard';
  $('#page-title').textContent = label;
  $('#breadcrumb-current').textContent = label;
  $('#sidebar').classList.remove('open');
  renderers[view]?.();
}
/* -------- NAV -------- */

/* -------- RENDERERS -------- */
const renderers = {
  dashboard: renderDashboard,
  voters: renderVoters,
  import: renderImport,
  payments: renderPayments,
  transactions: renderTransactions,
  audit: renderAudit,
  users: renderUsers,
  settings: renderSettings,
};

let charts = {};
function renderDashboard(){
  const paid = voters.filter(v=>v.status==='Paid').length;
  const pending = voters.filter(v=>v.status==='Pending').length;
  const eligible = voters.filter(v=>v.status!=='Ineligible').length;
  const success = txs.filter(t=>t.status==='Success');
  const failed = txs.filter(t=>t.status==='Failed').length;
  $('#s-total').textContent = voters.length.toLocaleString();
  $('#s-eligible').textContent = eligible.toLocaleString();
  $('#s-paid').textContent = paid.toLocaleString();
  $('#s-pending').textContent = pending.toLocaleString();
  $('#s-amount').textContent = fmt(success.reduce((s,t)=>s+t.amount,0));
  $('#s-failed').textContent = failed;
  $('#s-imports').textContent = imports.length;

  $('#recent-tx').innerHTML = txs.slice(0,10).map((t,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${t.voter.fullName}</td>
      <td><code>${t.voter.vin}</code></td>
      <td>${fmt(t.amount)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${t.date.toLocaleDateString()}</td>
      <td><button class="btn btn-sm btn-outline-primary" onclick="window.__vp.viewVoter(${t.voter.id})"><i class="fa-regular fa-eye"></i></button></td>
    </tr>`).join('');

  // charts
  const byState = {};
  STATES && Object.keys(STATES).forEach(s => byState[s]=0);
  success.forEach(t => byState[t.voter.state] = (byState[t.voter.state]||0) + t.amount);
  Object.values(charts).forEach(c => c?.destroy?.());
  charts.bar = new Chart($('#chart-bar'), {
    type:'bar',
    data:{labels:Object.keys(byState), datasets:[{label:'Amount (₦)', data:Object.values(byState), backgroundColor:'#1a3a5c', borderRadius:6}]},
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
  });
  const pie = {Paid: txs.filter(t=>t.status==='Success').length, Pending: txs.filter(t=>t.status==='Pending').length, Failed: failed};
  charts.pie = new Chart($('#chart-pie'), {
    type:'doughnut',
    data:{labels:Object.keys(pie), datasets:[{data:Object.values(pie), backgroundColor:['#0f8a4a','#f0a500','#b91c1c'], borderWidth:0}]},
    options:{responsive:true, plugins:{legend:{position:'bottom'}}}
  });
}

function statusBadge(s){
  const m = {Paid:'bg-paid', Pending:'bg-pending', Failed:'bg-failed', Ineligible:'bg-ineligible', Success:'bg-paid'};
  return `<span class="badge-pill ${m[s]||'bg-ineligible'}">${s}</span>`;
}

/* VOTERS */
function fillStateFilters(){
  const opts = '<option value="">All States</option>'+Object.keys(STATES).map(s=>`<option>${s}</option>`).join('');
  ['#f-state','#bulk-state','#tx-state'].forEach(sel => { if($(sel)) $(sel).innerHTML = opts; });
}
function fillLGAFilter(stateSel, lgaSel){
  const st = $(stateSel).value;
  const lgas = st ? STATES[st].lgas : [];
  $(lgaSel).innerHTML = '<option value="">All LGAs</option>'+lgas.map(l=>`<option>${l}</option>`).join('');
}

function renderVoters(){
  fillStateFilters();
  let list = voters.filter(v => {
    const q = $('#voter-search').value.toLowerCase().trim();
    const matchQ = !q || [v.fullName,v.vin,v.nin,v.bvn,v.phone].some(x=>x.toLowerCase().includes(q));
    const ms = !$('#f-state').value || v.state===$('#f-state').value;
    const ml = !$('#f-lga').value || v.lga===$('#f-lga').value;
    const mw = !$('#f-ward').value || v.ward===$('#f-ward').value;
    const mst= !$('#f-status').value || v.status===$('#f-status').value;
    return matchQ && ms && ml && mw && mst;
  });
  // wards
  const st = $('#f-state').value;
  $('#f-ward').innerHTML = '<option value="">All Wards</option>'+(st?STATES[st].wards:[]).map(w=>`<option>${w}</option>`).join('');

  $('#voters-empty').classList.toggle('d-none', list.length>0);
  const start = (voterPage-1)*PAGE_SIZE;
  const page = list.slice(start, start+PAGE_SIZE);
  $('#voters-body').innerHTML = page.map((v,i)=>`
    <tr>
      <td>${start+i+1}</td>
      <td>${v.fullName}</td>
      <td><code>${v.vin}</code></td>
      <td>${v.nin}</td>
      <td>${v.bvn}</td>
      <td>${v.phone}</td>
      <td>${v.bank}</td>
      <td>${v.account}</td>
      <td>${v.lga}</td>
      <td>${v.ward}</td>
      <td>${statusBadge(v.status)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" title="View" onclick="window.__vp.viewVoter(${v.id})"><i class="fa-regular fa-eye"></i></button>
        ${currentRole!=='auditor'?`<button class="btn btn-sm btn-success me-1" title="Pay" onclick="window.__vp.viewVoter(${v.id}, true)"><i class="fa-solid fa-money-bill"></i></button>`:''}
        <button class="btn btn-sm btn-outline-secondary" title="History" onclick="window.__vp.voterHistory(${v.id})"><i class="fa-solid fa-clock-rotate-left"></i></button>
      </td>
    </tr>`).join('');
  $('#voters-count').textContent = `${list.length} voters · page ${voterPage} of ${Math.max(1,Math.ceil(list.length/PAGE_SIZE))}`;
  const pages = Math.max(1, Math.ceil(list.length/PAGE_SIZE));
  $('#voters-pager').innerHTML = Array.from({length:pages}, (_,i)=>`<li class="page-item ${i+1===voterPage?'active':''}"><a class="page-link" href="#" data-p="${i+1}">${i+1}</a></li>`).join('');
  $$('#voters-pager a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();voterPage=+a.dataset.p;renderVoters();}));
}
['voter-search','f-state','f-lga','f-ward','f-status'].forEach(id => {
  document.addEventListener('input', e => { if(e.target.id===id){ voterPage=1; renderVoters(); }});
  document.addEventListener('change', e => { if(e.target.id===id){ voterPage=1; renderVoters(); }});
});
document.addEventListener('change', e => {
  if (e.target.id==='f-state') fillLGAFilter('#f-state','#f-lga');
  if (e.target.id==='bulk-state') fillLGAFilter('#bulk-state','#bulk-lga');
  if (e.target.id==='tx-state') fillLGAFilter('#tx-state','#tx-lga');
});

/* VOTER PANEL */
function viewVoter(id, focusPay){
  const v = voters.find(x=>x.id===id); if (!v) return;
  const paid = v.status==='Paid';
  $('#voter-panel-body').innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <div class="profile-card">
          <div class="big-avatar">${v.firstName[0]}${v.lastName[0]}</div>
          <h4 class="mb-0">${v.fullName}</h4>
          <div class="opacity-75 small mb-3">VIN: <code class="text-warning">${v.vin}</code></div>
          <div class="kv"><span class="k">NIN</span><span>${v.nin}</span></div>
          <div class="kv"><span class="k">BVN</span><span>${v.bvn}</span></div>
          <div class="kv"><span class="k">Phone</span><span>${v.phone}</span></div>
          <div class="kv"><span class="k">Occupation</span><span>${v.occupation}</span></div>
          <div class="kv"><span class="k">State / LGA</span><span>${v.state} / ${v.lga}</span></div>
          <div class="kv"><span class="k">Ward</span><span>${v.ward}</span></div>
          <div class="kv"><span class="k">Polling Unit</span><span>${v.polling}</span></div>
          <div class="kv"><span class="k">Status</span><span>${statusBadge(v.status)}</span></div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="pay-card">
          <h6 class="text-uppercase muted small">Payment Details</h6>
          <div class="kv text-dark"><span class="k">Bank</span><span>${v.bank}</span></div>
          <div class="kv text-dark"><span class="k">Account No.</span><span>${v.account}</span></div>
          <div class="kv text-dark"><span class="k">Account Name</span><span id="acc-name">— <span class="muted small">(not verified)</span></span></div>
          <div class="mt-3"><div class="muted small">Amount to pay</div><div class="pay-amount">${fmt(v.amount)}</div></div>
          ${paid?'<div class="alert-paid mt-3"><i class="fa-solid fa-triangle-exclamation me-2"></i>This voter has already been paid</div>':''}
          <button class="btn btn-success w-100 mt-3" id="verify-btn" ${paid?'disabled':''}><i class="fa-solid fa-check-double me-1"></i>Verify Bank Details</button>
          <button class="btn btn-primary w-100 mt-2" id="pay-btn" ${paid?'disabled':''}><i class="fa-solid fa-credit-card me-1"></i>Proceed to Pay via Paystack</button>
        </div>
      </div>
    </div>`;
  const oc = new bootstrap.Offcanvas('#voter-panel'); oc.show();
  $('#verify-btn')?.addEventListener('click', ()=>{
    $('#acc-name').innerHTML = `${v.fullName.toUpperCase()} <span class="badge-pill bg-success-sub ms-1"><i class="fa-solid fa-circle-check me-1"></i>Verified</span>`;
    toast('Account verified', 'success');
  });
  $('#pay-btn')?.addEventListener('click', ()=>paystackFlow(v));
}

function voterHistory(id){
  const v = voters.find(x=>x.id===id);
  const list = txs.filter(t=>t.voter.id===id);
  showModal(`<div class="modal-header"><h5 class="modal-title">Payment History — ${v.fullName}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body">${list.length===0?'<p class="muted">No payments yet.</p>':`<table class="table"><thead><tr><th>Txn ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>${list.map(t=>`<tr><td><code>${t.id}</code></td><td>${fmt(t.amount)}</td><td>${statusBadge(t.status)}</td><td>${t.date.toLocaleString()}</td></tr>`).join('')}</tbody></table>`}</div>`);
}

function paystackFlow(v){
  showModal(`<div class="modal-body text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <h5>Redirecting to Paystack…</h5>
      <p class="muted">Securely processing ${fmt(v.amount)} for ${v.fullName}</p>
    </div>`);
  setTimeout(()=>{
    const ok = Math.random() > .15;
    if (ok){
      v.status='Paid';
      const newTx = {id:'TXN-'+(++txId), voter:v, amount:v.amount, status:'Success', date:new Date(), by:$('#user-name').textContent};
      txs.unshift(newTx);
      showModal(`<div class="modal-body text-center py-5">
        <div style="font-size:60px;color:#16a34a"><i class="fa-solid fa-circle-check"></i></div>
        <h4 class="mt-3">Payment Successful</h4>
        <p class="muted mb-1">Transaction ID: <code>${newTx.id}</code></p>
        <p class="mb-1"><strong>${v.fullName}</strong> · ${fmt(v.amount)}</p>
        <button class="btn btn-primary mt-3" data-bs-dismiss="modal" onclick="window.__vp.go('transactions')">View Transactions</button>
      </div>`);
    } else {
      showModal(`<div class="modal-body text-center py-5">
        <div style="font-size:60px;color:#dc2626"><i class="fa-solid fa-circle-xmark"></i></div>
        <h4 class="mt-3">Payment Failed</h4>
        <p class="muted">Bank declined the transfer. Please try again.</p>
        <button class="btn btn-primary mt-3" onclick="window.__vp.retryPay(${v.id})">Retry</button>
      </div>`);
    }
  }, 1400);
}

/* IMPORT */
const EXPECTED_COLS = ['First Name','Last Name','Phone','NIN','BVN','Account Number','Bank Name','VIN','Polling Unit Code','Occupation','State','LGA','Ward'];
function renderImport(){
  $('#cols-body').innerHTML = EXPECTED_COLS.map((c,i)=>`<tr><td>${i+1}</td><td>${c}</td></tr>`).join('');
  $('#import-history').innerHTML = imports.map(h=>`<tr>
    <td>${h.date}</td><td>${h.file}</td><td>${h.total}</td>
    <td class="text-success">${h.success}</td><td class="text-warning">${h.dup}</td><td class="text-danger">${h.err}</td>
    <td>${h.by}</td><td><span class="badge-pill bg-paid">${h.status}</span></td></tr>`).join('');
}
const dz = $('#dropzone'); const fi = $('#file-input');
dz.addEventListener('click', ()=>fi.click());
['dragenter','dragover'].forEach(e=>dz.addEventListener(e, ev=>{ev.preventDefault();dz.classList.add('drag')}));
['dragleave','drop'].forEach(e=>dz.addEventListener(e, ev=>{ev.preventDefault();dz.classList.remove('drag')}));
dz.addEventListener('drop', e=>{ if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
fi.addEventListener('change', e=>{ if(e.target.files[0]) handleFile(e.target.files[0]); });
function handleFile(f){
  $('#file-info').classList.remove('d-none');
  $('#file-name').textContent = f.name;
  $('#file-size').textContent = (f.size/1024).toFixed(1)+' KB';
  $('#file-progress').style.width='0%';
  let p=0; const t=setInterval(()=>{ p+=10; $('#file-progress').style.width=p+'%'; if(p>=100){clearInterval(t);
    $('#preview-wrap').innerHTML = `<h6 class="mt-2">Preview (first 5 rows)</h6>
      <div class="table-responsive"><table class="table table-sm"><thead><tr>${EXPECTED_COLS.slice(0,6).map(c=>`<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${voters.slice(0,5).map(v=>`<tr><td>${v.firstName}</td><td>${v.lastName}</td><td>${v.phone}</td><td>${v.nin}</td><td>${v.bvn}</td><td>${v.account}</td></tr>`).join('')}</tbody></table></div>`;
  }},80);
}
$('#start-import').addEventListener('click', ()=>{
  const total=200, dup=8, err=4, ok=total-dup-err;
  $('#import-result').classList.remove('d-none');
  $('#import-result').innerHTML = `<div class="card border-success"><div class="card-body">
    <h5><i class="fa-solid fa-check-circle text-success me-2"></i>Import complete</h5>
    <div class="row text-center mt-3">
      <div class="col"><div class="muted small">Total</div><div class="h4">${total}</div></div>
      <div class="col"><div class="muted small">Imported</div><div class="h4 text-success">${ok}</div></div>
      <div class="col"><div class="muted small">Duplicates</div><div class="h4 text-warning">${dup}</div></div>
      <div class="col"><div class="muted small">Errors</div><div class="h4 text-danger">${err}</div></div>
    </div>
    <button class="btn btn-outline-danger mt-3"><i class="fa-solid fa-download me-1"></i>Download Error Report</button>
  </div></div>`;
  imports.unshift({date:new Date().toISOString().slice(0,10), file:$('#file-name').textContent, total, success:ok, dup, err, by:$('#user-name').textContent, status:'Completed'});
  renderImport();
  toast('Import completed','success');
});
$('#dl-template').addEventListener('click', ()=>{
  const csv = EXPECTED_COLS.join(',')+'\n'+'Adebola,Okonkwo,08012345678,12345678901,12345678901,0123456789,GTBank,9123456789012,PU/LA/001,Trader,Lagos,Ikeja,Ward A';
  download('voter_template.csv', csv);
});

/* PAYMENTS */
function renderPayments(){
  fillStateFilters();
  $('#pay-quick-result').innerHTML='';
  $('#bulk-body').innerHTML = voters.filter(v=>v.status==='Pending').slice(0,15).map(v=>`
    <tr><td><input type="checkbox" class="bulk-cb" data-id="${v.id}"></td>
    <td>${v.fullName}</td><td><code>${v.vin}</code></td><td>${v.bank}</td><td>${v.account}</td><td>${fmt(v.amount)}</td><td>${statusBadge(v.status)}</td></tr>`).join('');
}
$('#pay-quick-btn').addEventListener('click', ()=>{
  const q = $('#pay-quick').value.toLowerCase().trim();
  const v = voters.find(x=>[x.vin,x.nin,x.bvn].some(k=>k.toLowerCase()===q));
  if (!v){ $('#pay-quick-result').innerHTML = '<div class="alert alert-warning">No voter found.</div>'; return; }
  $('#pay-quick-result').innerHTML = `<div class="card"><div class="card-body d-flex justify-content-between align-items-center">
    <div><strong>${v.fullName}</strong> · ${v.vin} · ${v.bank} ${v.account}<br><span class="muted small">${v.state} / ${v.lga} / ${v.ward}</span></div>
    <button class="btn btn-success" onclick="window.__vp.viewVoter(${v.id}, true)"><i class="fa-solid fa-money-bill me-1"></i>Pay ${fmt(v.amount)}</button>
  </div></div>`;
});
document.addEventListener('change', e=>{
  if (e.target.id==='bulk-all') $$('.bulk-cb').forEach(cb=>cb.checked=e.target.checked);
});
$('#pay-selected').addEventListener('click', ()=>{
  const ids = $$('.bulk-cb:checked').map(c=>+c.dataset.id);
  if (ids.length===0) return toast('Select at least one voter','warning');
  const total = ids.length*AMT;
  showModal(`<div class="modal-header"><h5 class="modal-title">Confirm bulk payment</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body"><div class="alert alert-warning">This will process <strong>${ids.length}</strong> payments totaling <strong>${fmt(total)}</strong>.</div></div>
    <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="confirm-bulk">Confirm & Pay</button></div>`);
  setTimeout(()=>$('#confirm-bulk')?.addEventListener('click', ()=>{
    ids.forEach(id=>{ const v=voters.find(x=>x.id===id); if(v){v.status='Paid'; txs.unshift({id:'TXN-'+(++txId), voter:v, amount:v.amount, status:'Success', date:new Date(), by:$('#user-name').textContent});}});
    bootstrap.Modal.getInstance($('#gen-modal')).hide();
    renderPayments();
    toast(`Paid ${ids.length} voters · ${fmt(total)}`,'success');
  }), 50);
});

/* TRANSACTIONS */
function renderTransactions(){
  fillStateFilters();
  let list = txs.filter(t=>{
    const q=$('#tx-search').value.toLowerCase().trim();
    const matchQ=!q || [t.id,t.voter.fullName,t.voter.vin].some(x=>x.toLowerCase().includes(q));
    const ms=!$('#tx-state').value || t.voter.state===$('#tx-state').value;
    const ml=!$('#tx-lga').value || t.voter.lga===$('#tx-lga').value;
    const mst=!$('#tx-status').value || t.status===$('#tx-status').value;
    const f=$('#tx-from').value, to=$('#tx-to').value;
    const mf=!f || t.date>=new Date(f); const mt=!to || t.date<=new Date(to+'T23:59:59');
    return matchQ && ms && ml && mst && mf && mt;
  });
  $('#tx-c-total').textContent = list.length;
  $('#tx-c-amount').textContent = fmt(list.filter(t=>t.status==='Success').reduce((s,t)=>s+t.amount,0));
  $('#tx-c-success').textContent = list.filter(t=>t.status==='Success').length;
  $('#tx-c-failed').textContent = list.filter(t=>t.status==='Failed').length;
  $('#tx-body').innerHTML = list.map((t,i)=>`
    <tr>
      <td>${i+1}</td>
      <td><code>${t.id}</code></td>
      <td>${t.voter.fullName}</td>
      <td><code>${t.voter.vin}</code></td>
      <td>${t.voter.bank}</td>
      <td>${t.voter.account}</td>
      <td>${fmt(t.amount)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${t.date.toLocaleString()}</td>
      <td>${t.by}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="window.__vp.receipt('${t.id}')"><i class="fa-regular fa-file-lines"></i></button>
        ${t.status==='Failed'?`<button class="btn btn-sm btn-warning" onclick="window.__vp.retryPay(${t.voter.id})"><i class="fa-solid fa-rotate"></i></button>`:''}
      </td>
    </tr>`).join('');
}
['tx-search','tx-state','tx-lga','tx-status','tx-from','tx-to'].forEach(id => {
  document.addEventListener('input', e => { if(e.target.id===id) renderTransactions(); });
  document.addEventListener('change', e => { if(e.target.id===id) renderTransactions(); });
});

function receipt(id){
  const t = txs.find(x=>x.id===id); if(!t) return;
  showModal(`<div class="modal-header"><h5 class="modal-title">Payment Receipt</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body" id="receipt-body">
      <div class="text-center mb-3"><div style="font-size:32px;color:#1a3a5c"><i class="fa-solid fa-landmark"></i></div><h5 class="mb-0">Voter Payment System</h5><div class="muted small">Official Payment Receipt</div></div>
      <hr/>
      <div class="row g-2 small">
        <div class="col-6"><div class="muted">Transaction ID</div><strong><code>${t.id}</code></strong></div>
        <div class="col-6"><div class="muted">Date & Time</div><strong>${t.date.toLocaleString()}</strong></div>
        <div class="col-6"><div class="muted">Voter</div><strong>${t.voter.fullName}</strong></div>
        <div class="col-6"><div class="muted">VIN</div><strong><code>${t.voter.vin}</code></strong></div>
        <div class="col-6"><div class="muted">Bank</div><strong>${t.voter.bank}</strong></div>
        <div class="col-6"><div class="muted">Account</div><strong>${t.voter.account}</strong></div>
        <div class="col-6"><div class="muted">Processed By</div><strong>${t.by}</strong></div>
        <div class="col-6"><div class="muted">Status</div>${statusBadge(t.status)}</div>
      </div>
      <hr/>
      <div class="text-center"><div class="muted">Amount</div><div style="font-size:28px;font-weight:700;color:#1a3a5c">${fmt(t.amount)}</div></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline-secondary" onclick="window.print()"><i class="fa-solid fa-print me-1"></i>Print</button>
      <button class="btn btn-primary" onclick="window.__vp.downloadReceipt('${t.id}')"><i class="fa-solid fa-download me-1"></i>Download</button>
    </div>`);
}
function downloadReceipt(id){
  const t = txs.find(x=>x.id===id);
  const txt = `VOTER PAYMENT RECEIPT\n=====================\nTxn ID: ${t.id}\nDate: ${t.date.toLocaleString()}\nVoter: ${t.voter.fullName}\nVIN: ${t.voter.vin}\nBank: ${t.voter.bank}\nAccount: ${t.voter.account}\nAmount: ${fmt(t.amount)}\nStatus: ${t.status}\nProcessed By: ${t.by}\n`;
  download(`${t.id}.txt`, txt);
}

/* AUDIT */
function renderAudit(){
  $('#au-user').innerHTML = '<option value="">All Users</option>'+Array.from(new Set(audit.map(a=>a.user))).map(u=>`<option>${u}</option>`).join('');
  const list = audit.filter(a => {
    const q=$('#au-search').value.toLowerCase().trim();
    return (!q || [a.user,a.action,a.details].some(x=>x.toLowerCase().includes(q)))
      && (!$('#au-user').value || a.user===$('#au-user').value)
      && (!$('#au-action').value || a.action===$('#au-action').value);
  });
  $('#au-timeline').innerHTML = list.map(a=>`
    <div class="timeline-item">
      <div class="ti-card">
        <div class="d-flex justify-content-between">
          <div><strong>${a.user}</strong> <span class="badge-pill bg-ineligible ms-1">${a.action}</span></div>
          <small class="muted">${a.ts.toLocaleString()}</small>
        </div>
        <div class="muted small mt-1">${a.details} · IP: ${a.ip}</div>
      </div>
    </div>`).join('');
  $('#au-table-body').innerHTML = list.map(a=>`<tr><td>${a.user}</td><td>${a.action}</td><td>${a.details}</td><td>${a.ip}</td><td>${a.ts.toLocaleString()}</td></tr>`).join('');
}
['au-search','au-user','au-action'].forEach(id => {
  document.addEventListener('input', e => { if(e.target.id===id) renderAudit(); });
  document.addEventListener('change', e => { if(e.target.id===id) renderAudit(); });
});
$('#au-timeline-btn').addEventListener('click', ()=>{$('#au-timeline').classList.remove('d-none');$('#au-table').classList.add('d-none');$('#au-timeline-btn').classList.add('active');$('#au-table-btn').classList.remove('active')});
$('#au-table-btn').addEventListener('click', ()=>{$('#au-timeline').classList.add('d-none');$('#au-table').classList.remove('d-none');$('#au-table-btn').classList.add('active');$('#au-timeline-btn').classList.remove('active')});

/* USERS */
function renderUsers(){
  $('#users-body').innerHTML = sysUsers.map((u,i)=>`
    <tr>
      <td>${i+1}</td><td>${u.name}</td><td>${u.email}</td>
      <td><span class="badge-pill role-${u.role==='super_admin'?'super':u.role==='payment_officer'?'officer':'auditor'}">${ROLE_LABEL[u.role]}</span></td>
      <td>${u.last}</td>
      <td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" ${u.active?'checked':''} onchange="window.__vp.toggleUser(${i})"></div></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="window.__vp.editUser(${i})"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="btn btn-sm btn-outline-secondary me-1" onclick="window.__vp.resetPw(${i})"><i class="fa-solid fa-key"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="window.__vp.toggleUser(${i})"><i class="fa-solid fa-user-slash"></i></button>
      </td>
    </tr>`).join('');
}
$('#add-user-btn').addEventListener('click', ()=>userModal());
function userModal(idx){
  const u = idx!=null ? sysUsers[idx] : {name:'',email:'',role:'payment_officer',active:true};
  showModal(`<div class="modal-header"><h5 class="modal-title">${idx!=null?'Edit':'Add'} User</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body"><div class="row g-3">
      <div class="col-md-6"><label class="form-label">Full Name</label><input class="form-control" id="u-name" value="${u.name}"></div>
      <div class="col-md-6"><label class="form-label">Email</label><input class="form-control" id="u-email" value="${u.email}"></div>
      <div class="col-md-6"><label class="form-label">Role</label><select class="form-select" id="u-role"><option value="super_admin"${u.role==='super_admin'?' selected':''}>Super Admin</option><option value="payment_officer"${u.role==='payment_officer'?' selected':''}>Payment Officer</option><option value="auditor"${u.role==='auditor'?' selected':''}>Auditor</option></select></div>
      <div class="col-md-6"><label class="form-label d-block">Active</label><div class="form-check form-switch mt-2"><input class="form-check-input" type="checkbox" id="u-active" ${u.active?'checked':''}></div></div>
      <div class="col-md-6"><label class="form-label">Password</label><input type="password" class="form-control" placeholder="••••••••"></div>
      <div class="col-md-6"><label class="form-label">Confirm</label><input type="password" class="form-control" placeholder="••••••••"></div>
    </div></div>
    <div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="save-user">Save</button></div>`);
  setTimeout(()=>$('#save-user')?.addEventListener('click', ()=>{
    const data = {name:$('#u-name').value, email:$('#u-email').value, role:$('#u-role').value, active:$('#u-active').checked, last:'just now'};
    if (idx!=null) Object.assign(sysUsers[idx], data); else sysUsers.push(data);
    bootstrap.Modal.getInstance($('#gen-modal')).hide();
    renderUsers(); toast('User saved','success');
  }), 50);
}

/* SETTINGS */
function renderSettings(){
  $$('#settings-tabs .nav-link').forEach(a=>a.addEventListener('click', e=>{
    e.preventDefault();
    $$('#settings-tabs .nav-link').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    $$('.tab-pane').forEach(p=>p.classList.toggle('d-none', p.dataset.tab!==a.dataset.tab));
  }, {once:true}));
  $$('.tab-pane').forEach(p=>p.classList.toggle('d-none', p.dataset.tab!=='general'));
  $('#settings-tabs .nav-link').classList.add('active');
}

/* HELPERS */
function showModal(html){
  $('#gen-modal-content').innerHTML = html;
  const m = bootstrap.Modal.getOrCreateInstance($('#gen-modal'));
  m.show();
}
function toast(msg, type='info'){
  const colors = {success:'#16a34a', error:'#dc2626', warning:'#f59e0b', info:'#1a3a5c'};
  const icons = {success:'circle-check', error:'circle-xmark', warning:'triangle-exclamation', info:'circle-info'};
  const id = 't'+Date.now();
  $('#toast-root').insertAdjacentHTML('beforeend',
    `<div id="${id}" class="toast align-items-center text-white border-0" role="alert" style="background:${colors[type]}"><div class="d-flex"><div class="toast-body"><i class="fa-solid fa-${icons[type]} me-2"></i>${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`);
  const el = $('#'+id); new bootstrap.Toast(el, {delay:2800}).show();
  el.addEventListener('hidden.bs.toast', ()=>el.remove());
}
function download(name, data){
  const blob = new Blob([data], {type:'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function retryPay(id){ const v=voters.find(x=>x.id===id); if(v) paystackFlow(v); }
function toggleUser(idx){ sysUsers[idx].active = !sysUsers[idx].active; renderUsers(); }
function editUser(idx){ userModal(idx); }
function resetPw(idx){ toast(`Password reset link sent to ${sysUsers[idx].email}`, 'success'); }

/* expose */
window.__vp = { go, viewVoter, voterHistory, retryPay, receipt, downloadReceipt, toggleUser, editUser, resetPw };
window.toast = toast;

})();
