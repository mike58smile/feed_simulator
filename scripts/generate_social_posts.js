const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '..', 'public', 'data', 'social_posts.json')

const topics = {
  politics: [
    'Nová místní iniciativa',
    'Debata o rozpočtu',
    'Transparentnost ve veřejných zakázkách',
    'Volby a místní aktivity',
    'Diskuse o dopravě'
  ],
  ecology: [
    'Zalesňovací projekt',
    'Čistší řeky',
    'Úspora vody v obcích',
    'Zachování mokřadů',
    'Místní recyklační akce'
  ],
  technology: [
    'Startup testuje AI',
    'Nové komunitní Wi‑Fi',
    'Bezpečnost dat ve městě',
    'Smart řešení pro dopravu',
    'Aplikace pro sousedy'
  ],
  culture: [
    'Festival sousedských filmů',
    'Místní galerie představuje výstavu',
    'Divadelní večer na náměstí',
    'Workshop tradičních řemesel',
    'Knižní burza u parku'
  ],
  health: [
    'Očkovací kampaň v obci',
    'Poradna duševního zdraví',
    'Lokální program pohybu',
    'Zdravé stravování pro školy',
    'Dobrovolnická pomoc seniorům'
  ]
}

const sentiments = ['positive', 'neutral', 'negative']

function rand(min, max) { return Math.random() * (max - min) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const posts = []
const topicKeys = Object.keys(topics)

for (let i = 1; i <= 100; i++) {
  const topic = pick(topicKeys)
  const title = pick(topics[topic]) + (i % 5 === 0 ? ' — pokračování' : '')
  const sentiment = (i % 7 === 0) ? 'neutral' : pick(sentiments) // slightly more varied
  const intensity = Math.round(rand(30, 90)) / 100 // 0.30 - 0.90
  const image = `https://source.unsplash.com/800x600/?${topic}`
  const text = (() => {
    switch (topic) {
      case 'politics': return 'Obyvatelé diskutují o dopadech na místní komunitu.'
      case 'ecology': return 'Dobrovolníci se zapojili do úklidu a výsadby stromků.'
      case 'technology': return 'Nové řešení zjednodušuje každodenní úkony.'
      case 'culture': return 'Událost přitáhla místní umělce i rodiny.'
      case 'health': return 'Program pomáhá zvýšit dostupnost péče pro všechny.'
      default: return 'Aktualita ovlivní sousedství.'
    }
  })()

  posts.push({
    id: i,
    title,
    topic,
    sentiment,
    intensity,
    image,
    text
  })
}

fs.writeFileSync(OUT, JSON.stringify(posts, null, 2), 'utf8')

// quick validation
const data = JSON.parse(fs.readFileSync(OUT, 'utf8'))
const ids = new Set()
let ok = true
for (const p of data) {
  if (!p.id || ids.has(p.id)) { ok = false; console.error('Duplicate or missing id', p.id); break }
  ids.add(p.id)
  if (typeof p.intensity !== 'number' || p.intensity < 0 || p.intensity > 1) { ok = false; console.error('Bad intensity on', p.id); break }
  if (!['positive','neutral','negative'].includes(p.sentiment)) { ok = false; console.error('Bad sentiment on', p.id); break }
}

console.log(`Wrote ${data.length} posts to ${OUT} — validation ${ok ? 'PASS' : 'FAIL'}`)

if (!ok) process.exit(2)
