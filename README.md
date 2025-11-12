# Mimo moju bublinu

Interaktívna webová aplikácia, ktorá simuluje personalizačný algoritmus podobný sociálnym sieťam. Používateľ môže reagovať na príspevky, sledovať, ako sa feed zužuje podľa jeho preferencií, a následne dostať analýzu svojej informačnej bubliny.

## 🚀 Spustenie projektu

```bash
npm install
npm run dev
```

Aplikácia beží na `http://localhost:5173`.

## 🧠 Čo aplikácia robí

- simulovaný feed príspevkov (50+ tém)
- reakcie (like, komentár, zdieľanie, preskočenie) menia váhu preferencií
- algoritmus postupne filtruje obsah a posilňuje extrémy
- analýza po niekoľkých kolách ukáže pie chart tém, sentiment a skryté témy
- edukačný záver vysvetlí, čo sa stalo, a ponúkne „transparentný režim“

## 🛠️ Technológie

- React + Vite
- Tailwind CSS
- Chart.js (cez react-chartjs-2)
- Dataset v `public/data/posts.json`

## 🧪 Rady k workshopu

- nechajte účastníkov interagovať aspoň 5 kôl
- po analýze diskutujte, ktoré témy zmizli a prečo
- v transparentnom režime ukážte, ako by mohol vyzerať otvorený algoritmus

## 🧾 Licencia obrázkov

Obrázky sú generované z Unsplash API URL. Pri produkčnom použití ich nahraďte lokálnymi súbormi s licenčne vysporiadaným obsahom.
