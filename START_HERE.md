# 📖 DOCUMENTATION - WHERE TO START

## 🚀 Choose One:

**👉 I'm completely new and confused**
→ Read: **SETUP_GUIDE.md** (very dumbed down, everything explained)

**👉 Just show me the commands**
→ Read: **QUICKSTART.md** (4 quick steps)

**👉 I need to know the metadata format**
→ Read: **METADATA_TEMPLATE.md**

**👉 I want all the technical details**
→ Read: **AWS_IPFS_GUIDE.md** or **PRODUCTION_SETUP.md**

---

## 📚 What Each File Contains

| File | Purpose |
|------|---------|
| **SETUP_GUIDE.md** | Complete guide - everything explained simply |
| **QUICKSTART.md** | 4 quick steps to get started |
| **METADATA_TEMPLATE.md** | JSON metadata format and structure |
| **AWS_IPFS_GUIDE.md** | Detailed AWS & IPFS guide |
| **PRODUCTION_SETUP.md** | Production checklist |
| **README.md** | Project overview |

---

## ⚡ 30-Second Version

```bash
# 1. Add your 156 images to /layers/
# 2. Generate:
npm run generate:aws          # Fast (10 min, $5-15)
npm run generate:local        # Slow (2-3 hrs, free)

# 3. Upload to IPFS:
npm run upload:ipfs

# 4. Deploy:
cd smart-contract && npm run deploy
```

---

## 🎯 Start With SETUP_GUIDE.md

It has everything you need in plain English.
