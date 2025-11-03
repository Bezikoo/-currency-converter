## Currency Converter
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

