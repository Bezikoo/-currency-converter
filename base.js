
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const fromAmount = document.getElementById('from-amount');
const toAmount = document.getElementById('to-amount');
const swapBtn = document.getElementById('swap-btn');
const convertBtn = document.getElementById('convert-btn');
const refreshBtn = document.getElementById('refresh-btn');
const rateInfo = document.getElementById('rate-info');
const updatedInfo = document.getElementById('updated-info');
const favFromBtn = document.getElementById('fav-from');
const favToBtn = document.getElementById('fav-to');

const NBU_API = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json';
const EXCLUDED_CODES = ['XAU','XAG','XPT','XPD']; // золото, срібло, платина, паладій
let nbuRates = null; 
let lastFetched = null;
let selectsPopulated = false;
let favorites = loadFavorites();

function fmt(v){
	if (v === null || v === undefined || Number.isNaN(v)) return '-';
	return Number(v).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

async function fetchNbu(){
	try{
		const res = await fetch(NBU_API);
		if(!res.ok) throw new Error('Network error');
		const data = await res.json();
		const map = { UAH: 1 };
		data.forEach(item => {
			if (item && item.cc && item.rate) map[item.cc] = Number(item.rate);
		});
		nbuRates = map;
		lastFetched = Date.now();
		populateSelectsFromRates();
		return map;
	}catch(err){
		console.error('Помилка завантаження курсів НБУ', err);
		throw err;
	}
}

function getFactor(from, to){
	if(!nbuRates) return null;
	if(from === to) return 1;
	if(from === 'UAH'){
		const rTo = nbuRates[to];
		if(!rTo) return null;
		return 1 / rTo;
	}
	if(to === 'UAH'){
		const rFrom = nbuRates[from];
		if(!rFrom) return null;
		return rFrom;
	}
	const rFrom = nbuRates[from];
	const rTo = nbuRates[to];
	if(!rFrom || !rTo) return null;
	return rFrom / rTo;
}

let suppressSelectChange = false;
let prevFrom = fromSelect.value;
let prevTo = toSelect.value;

function swapCurrencies(){
	const a = fromSelect.value;
	const b = toSelect.value;
	suppressSelectChange = true;
	fromSelect.value = b;
	toSelect.value = a;
	suppressSelectChange = false;
	prevFrom = fromSelect.value;
	prevTo = toSelect.value;
	updateConversion();
}

	function populateSelectsFromRates(){
		if(!nbuRates) return;
		const codesSet = new Set(['UAH', ...Object.keys(nbuRates)]);
		EXCLUDED_CODES.forEach(c => codesSet.delete(c));
		const allCodes = Array.from(codesSet).sort();
		const favCodes = allCodes.filter(c => favorites.has(c));
		const otherCodes = allCodes.filter(c => !favorites.has(c));

		const keepFrom = fromSelect.value;
		const keepTo = toSelect.value;

		const toOptionsHtml = (codes)=> codes.map(c => `<option value="${c}">${c}</option>`).join('');
		let html = '';
		if(favCodes.length){
			html += `<optgroup label="★ Улюблені">${toOptionsHtml(favCodes)}</optgroup>`;
		}
		html += toOptionsHtml(otherCodes);
		fromSelect.innerHTML = html;
		toSelect.innerHTML = html;

		const all = [...favCodes, ...otherCodes];
		const defFrom = all.includes('UAH') ? 'UAH' : all[0];
		const defTo = all.includes('USD') ? 'USD' : (all.find(c => c !== defFrom) || all[0]);

		fromSelect.value = all.includes(keepFrom) ? keepFrom : defFrom;
		toSelect.value = all.includes(keepTo) ? keepTo : defTo;

		prevFrom = fromSelect.value;
		prevTo = toSelect.value;

		selectsPopulated = true;
		updateFavButtons();
	}

function onFromChange(){
	if(suppressSelectChange) return;
	const newFrom = fromSelect.value;
	if(newFrom === prevTo){
		suppressSelectChange = true;
		fromSelect.value = newFrom;
		toSelect.value = prevFrom;
		suppressSelectChange = false;
		prevFrom = fromSelect.value;
		prevTo = toSelect.value;
		updateConversion();
		return;
	}
	prevFrom = fromSelect.value;
	prevTo = toSelect.value;
	updateConversion();
}

function onToChange(){
	if(suppressSelectChange) return;
	const newTo = toSelect.value;
	if(newTo === prevFrom){
		suppressSelectChange = true;
		toSelect.value = newTo;
		fromSelect.value = prevTo;
		suppressSelectChange = false;
		prevFrom = fromSelect.value;
		prevTo = toSelect.value;
		updateConversion();
		return;
	}
	prevFrom = fromSelect.value;
	prevTo = toSelect.value;
	updateConversion();
}

async function updateConversion(){
	const from = fromSelect.value;
	const to = toSelect.value;
	const amount = parseFloat(fromAmount.value) || 0;

	try{
		if(!nbuRates) await fetchNbu();
	}catch(err){
		rateInfo.textContent = 'Не вдалось отримати курси НБУ';
		toAmount.value = '—';
		updatedInfo.textContent = '';
		return;
	}

	const factor = getFactor(from,to);
	if(factor === null){
		rateInfo.textContent = 'Курс не визначено';
		toAmount.value = '—';
		updatedInfo.textContent = '';
		return;
	}

	const result = amount * factor;
	toAmount.value = fmt(result);
	rateInfo.textContent = `1 ${from} = ${fmt(factor)} ${to}`;
	updatedInfo.textContent = lastFetched ? `оновлено: ${new Date(lastFetched).toLocaleString()}` : '';
	updateFavButtons();
}

let tmr = null;
fromAmount.addEventListener('input', ()=>{
	clearTimeout(tmr);
	tmr = setTimeout(updateConversion, 250);
});

swapBtn.addEventListener('click', swapCurrencies);
convertBtn.addEventListener('click', updateConversion);
refreshBtn.addEventListener('click', async ()=>{ nbuRates = null; await updateConversion(); });
fromSelect.addEventListener('change', onFromChange);
toSelect.addEventListener('change', onToChange);

updateConversion();


function loadFavorites(){
	try{
		const raw = localStorage.getItem('favCurrencies');
		if(!raw) return new Set();
		const arr = JSON.parse(raw);
		return new Set(Array.isArray(arr)?arr:[]);
	}catch{ return new Set(); }
}
function saveFavorites(){
	try{ localStorage.setItem('favCurrencies', JSON.stringify(Array.from(favorites))); }catch{}
}
function isFav(code){ return favorites.has(code); }
function toggleFav(code){
	if(!code) return;
	if(isFav(code)) favorites.delete(code); else favorites.add(code);
	saveFavorites();

	populateSelectsFromRates();
	updateFavButtons();
}
function updateFavButtons(){
	if(favFromBtn) {
		const code = fromSelect.value;
		const active = isFav(code);
		favFromBtn.classList.toggle('active', active);
		favFromBtn.textContent = active ? '★' : '☆';
		favFromBtn.title = active ? 'В улюблених' : 'Додати в улюблені';
	}
	if(favToBtn) {
		const code = toSelect.value;
		const active = isFav(code);
		favToBtn.classList.toggle('active', active);
		favToBtn.textContent = active ? '★' : '☆';
		favToBtn.title = active ? 'В улюблених' : 'Додати в улюблені';
	}
}

favFromBtn?.addEventListener('click', ()=> toggleFav(fromSelect.value));
favToBtn?.addEventListener('click', ()=> toggleFav(toSelect.value));
// https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json api 