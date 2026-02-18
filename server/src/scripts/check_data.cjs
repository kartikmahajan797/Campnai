const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/G3/OneDrive/Desktop/Campnai/server/src/influencers_data.json', 'utf8'));
console.log('Total JSON records:', data.length);
console.log('\nFirst 5 IDs:', data.slice(0,5).map(x => x.id));
console.log('\nSample record (index 0):\n', JSON.stringify(data[0], null, 2));
