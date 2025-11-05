## Currency Converter

English

---

## Project overview

A compact client-side currency converter built with HTML/CSS/JS. Open `index.html`, enter an amount, choose source and target currencies — the result updates immediately.

Core features
- Live conversion
- Currency selection and swap
- Basic input validation and formatted output

Minimal function summary
- fetchExchangeRates(): get rates (API or local), return map of codes→rates.
- convertCurrency(amount, from, to, rates): return converted numeric value (watch for NaN and missing rates).
- populateCurrencySelectors(rates): fill <select> options.
- formatNumber(value, locale, currency): localized display.
- cacheRates(rates, ttl): optional localStorage caching.

Files
- `index.html` — UI and script include
- `base.js` — main logic
- `designer.css` — styles




---

Українська

## Опис проєкту

Компактний клієнтський конвертор валют на HTML/CSS/JS. Відкрийте `index.html`, введіть суму, оберіть валюту-джерело та валюту-призначення — результат оновиться одразу.

Основні можливості
- Жива конвертація
- Вибір валют та обмін (swap)
- Базова валідація вводу та форматований вивід

Короткий опис функцій
- fetchExchangeRates(): отримує курси (API або локально), повертає мапу код→курс.
- convertCurrency(amount, from, to, rates): повертає конвертоване число (увага на NaN або відсутній курс).
- populateCurrencySelectors(rates): заповнює <select> опції.
- formatNumber(value, locale, currency): локалізований вивід числа.
- cacheRates(rates, ttl): опційне кешування у localStorage.

Файли
- `index.html` — інтерфейс
- `base.js` — логіка
- `designer.css` — стилі

