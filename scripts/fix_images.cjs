const fs = require('fs');
const https = require('https');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'public', 'data', 'posts_grok copy.json');

// Map of fallback images by topic
const fallbackImages = {
  politics: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  ecology: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  technology: 'https://images.unsplash.com/photo-1516321310766-d9c6e1f2126f?w=800&q=80',
  culture: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d4?w=800&q=80',
  health: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
  society: 'https://images.unsplash.com/photo-1515162305284-7f4f1e69ffaf?w=800&q=80'
};

function checkUrl(url) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000);

    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      clearTimeout(timeout);
      resolve(res.statusCode === 200);
    }).on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function main() {
  console.log('Loading posts...');
  const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  
  console.log(`Checking ${data.length} image URLs...`);
  let fixed = 0;
  let checked = 0;

  for (const post of data) {
    checked++;
    process.stdout.write(`\rChecking ${checked}/${data.length}...`);
    
    const isValid = await checkUrl(post.image);
    
    if (!isValid) {
      const fallback = fallbackImages[post.topic] || fallbackImages.technology;
      console.log(`\n❌ ID ${post.id}: ${post.image} -> ${fallback}`);
      post.image = fallback;
      fixed++;
    }
  }

  if (fixed > 0) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n\n✅ Fixed ${fixed} broken image links`);
  } else {
    console.log('\n\n✅ All images are working!');
  }
}

main().catch(console.error);
