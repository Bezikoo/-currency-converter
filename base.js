
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const fromAmount = document.getElementById('from-amount');
const toAmount = document.getElementById('to-amount');
const swapBtn = document.getElementById('swap-btn');
const rateInfo = document.getElementById('rate-info');
const updatedInfo = document.getElementById('updated-info');
const favFromBtn = document.getElementById('fav-from');
const favToBtn = document.getElementById('fav-to');
const langToggle = document.getElementById('lang-toggle');

const translations = {
	en: {
		title: 'Currency Converter',
		labelFrom: 'From',
		labelTo: 'To',
		amountLabel: 'Amount',
		resultLabel: 'Result',
		favAdd: 'Add to favorites',
		favInFav: 'In favorites',
		swapTitle: 'Swap currencies',
		rateFetchError: 'Failed to load NBU rates',
		rateNotDefined: 'Rate not defined',
		updatedPrefix: 'updated:',
		placeholderFrom: '0.00',
		placeholderTo: '0.00',
		favoritesLabel: '★ Favorites'
	},
	uk: {
		title: 'Конвертор валют',
		labelFrom: 'Від',
		labelTo: 'До',
		amountLabel: 'Сума',
		resultLabel: 'Результат',
		favAdd: 'Додати в улюблені',
		favInFav: 'В улюблених',
		swapTitle: 'Поменяти місцями',
		rateFetchError: 'Не вдалось отримати курси НБУ',
		rateNotDefined: 'Курс не визначено',
		updatedPrefix: 'оновлено:',
		placeholderFrom: '0.00',
		placeholderTo: '0.00',
		favoritesLabel: '★ Улюблені'
	}
};

let currentLang = localStorage.getItem('lang') || 'uk';

function t(key){ return translations[currentLang] && translations[currentLang][key] ? translations[currentLang][key] : key; }

function applyLanguage(lang){
	currentLang = lang;
	try{ document.documentElement.lang = (lang === 'en' ? 'en' : 'uk'); }catch{}
	const titleEl = document.querySelector('.title');
	const fromLabel = document.querySelector('label[for="from-currency"]');
	const toLabel = document.querySelector('label[for="to-currency"]');
	const amountLabel = document.querySelector('label[for="from-amount"]');
	const resultLabel = document.querySelector('label[for="to-amount"]');
	if(titleEl) titleEl.textContent = t('title');
	if(fromLabel) fromLabel.textContent = t('labelFrom');
	if(toLabel) toLabel.textContent = t('labelTo');
	if(amountLabel) amountLabel.textContent = t('amountLabel');
	if(resultLabel) resultLabel.textContent = t('resultLabel');
	if(fromAmount) fromAmount.placeholder = t('placeholderFrom');
	if(toAmount) toAmount.placeholder = t('placeholderTo');
	if(swapBtn) swapBtn.title = t('swapTitle');
	if(favFromBtn) favFromBtn.title = t('favAdd');
	if(favToBtn) favToBtn.title = t('favAdd');
	if(langToggle) langToggle.textContent = (lang === 'en' ? 'EN' : 'UA');
	if(selectsPopulated) populateSelectsFromRates();
}

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

// format currency amounts to 2 decimal places for display
function formatMoney2(v){
	if (v === null || v === undefined || Number.isNaN(v)) return '-';
	return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// sanitize input element value to at most 2 decimal places (truncates extra digits)
function sanitizeTwoDecimalsInput(el){
	if(!el || !el.value) return;
	// normalize comma to dot
	let s = String(el.value).replace(',', '.');
	// allow leading dot like ".5"
	const parts = s.split('.');
	if(parts.length > 1){
		const intPart = parts[0];
		const fracPart = parts.slice(1).join(''); // in case user typed multiple dots
		if(fracPart.length > 2){
			el.value = intPart + '.' + fracPart.slice(0,2);
		}else{
			el.value = intPart + (fracPart.length ? '.'+fracPart : '');
		}
	}else{
		el.value = parts[0];
	}
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
			console.error('Failed to fetch NBU rates', err);
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
			html += `<optgroup label="${t('favoritesLabel')}">${toOptionsHtml(favCodes)}</optgroup>`;
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
		rateInfo.textContent = t('rateFetchError');
		toAmount.value = '—';
		updatedInfo.textContent = '';
		return;
	}

	const factor = getFactor(from,to);
	if(factor === null){
		rateInfo.textContent = t('rateNotDefined');
		toAmount.value = '—';
		updatedInfo.textContent = '';
		return;
	}

	const result = amount * factor;
	// show converted result rounded to 2 decimal places
	toAmount.value = formatMoney2(result);
	rateInfo.textContent = `1 ${from} = ${fmt(factor)} ${to}`;
	updatedInfo.textContent = lastFetched ? `${t('updatedPrefix')} ${new Date(lastFetched).toLocaleString()}` : '';
	updateFavButtons();
}

let tmr = null;
fromAmount.addEventListener('input', ()=>{
	// ensure at most two decimal places while typing
	sanitizeTwoDecimalsInput(fromAmount);
	clearTimeout(tmr);
	tmr = setTimeout(updateConversion, 250);
});

// round to two decimals on blur and trigger conversion
fromAmount.addEventListener('blur', ()=>{
	if(!fromAmount.value) return;
	const n = parseFloat(String(fromAmount.value).replace(',', '.'));
	if(Number.isNaN(n)){
		fromAmount.value = '';
		toAmount.value = '';
		return;
	}
	fromAmount.value = n.toFixed(2);
	updateConversion();
});


swapBtn.addEventListener('click', swapCurrencies);
fromSelect.addEventListener('change', onFromChange);
toSelect.addEventListener('change', onToChange);

// language toggle handler
langToggle?.addEventListener('click', ()=>{
	const next = currentLang === 'en' ? 'uk' : 'en';
	localStorage.setItem('lang', next);
	applyLanguage(next);
	updateConversion();
});

// apply initial language and run conversion
applyLanguage(currentLang);
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
		favFromBtn.title = active ? t('favInFav') : t('favAdd');
	}
	if(favToBtn) {
		const code = toSelect.value;
		const active = isFav(code);
		favToBtn.classList.toggle('active', active);
		favToBtn.textContent = active ? '★' : '☆';
		favToBtn.title = active ? t('favInFav') : t('favAdd');
	}
}

favFromBtn?.addEventListener('click', ()=> toggleFav(fromSelect.value));
favToBtn?.addEventListener('click', ()=> toggleFav(toSelect.value));
// https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json api 