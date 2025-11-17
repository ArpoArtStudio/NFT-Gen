#!/usr/bin/env node
/**
 * Simple CID Replacement Script
 * Rewrites image field inside metadata JSON files after image upload.
 * Usage:
 *   node scripts/rewrite-metadata-images.mjs --cid=NEW_IMAGES_CID --dir=./output/metadata
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2).reduce((acc, cur) => { const [k,v] = cur.split('='); acc[k.replace('--','')] = v || true; return acc; }, {});
const cid = args.cid;
const dir = args.dir || './output/metadata';
if (!cid) { console.error('❌ Missing --cid'); process.exit(1); }
if (!fs.existsSync(dir)) { console.error('❌ Directory not found:', dir); process.exit(1); }

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
let changed = 0;
for (const f of files) {
  const p = path.join(dir, f);
  const data = JSON.parse(fs.readFileSync(p,'utf8'));
  // Replace image base path pattern ipfs://ANY/ with new CID
  if (data.image) {
    data.image = `ipfs://${cid}/${f.replace('.json','.png')}`;
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    changed++;
  }
}
console.log(`✅ Updated image field in ${changed} files using CID ${cid}`);
console.log('Next: Upload updated metadata directory again if needed or set contract baseURI to metadata CID');
