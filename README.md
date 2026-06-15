***Application link:*** https://netflix-recommendation-app.vercel.app/

# 🎬 Netflix Recommendation Engine

> End-to-end recommendation system built on the Netflix Prize Dataset.
> Implements SVD Matrix Factorization and ALS Implicit Feedback models,
> evaluated on RMSE and MAP@10, with a full-stack React + Node.js web app.

## Results Summary

| Model | RMSE ↓ | MAP@10 ↑ | Train Time |
|-------|--------|----------|------------|
| SVD   | 0.9124 | 0.1832   | 47.3s      |
| ALS   | 1.1247 | 0.2241   | 31.8s      |

---

## Repository Structure
```text
.
├── netflix-recommendation-app/
│   ├── backend/
│   └── frontend/
├── README.md
└── cult-ml.ipynb
---
```

## Quickstart

### 1. Run the Kaggle Notebook

1. Go to [Kaggle](https://www.kaggle.com) and create a new notebook
2. Add the **Netflix Prize Data** dataset from:
   `https://www.kaggle.com/datasets/netflix-inc/netflix-prize-data`
3. Paste Cells 1–8 in order and run all
4. After Cell 8 completes, download all output files from:
   **Session panel → Output → Download All**
5. Place the downloaded files into the `backend/` folder in VS code, the folder structure in VS Code is same as netflix-recommendation-app additionally the .env is there in the backend having the VITE_TMDB_API_KEY.


### 2. Start the Backend

```bash
# Prerequisites: Node.js >= 18, Python >= 3.9
cd backend

# Install Node dependencies
npm install

# Install Python dependencies
pip install scikit-surprise implicit numpy pandas scipy

# Start the API server
node server.js

# Server runs at http://localhost:3001
# Verify: curl http://localhost:3001/api/health
```

### 3. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the React development server
npm run dev

# App runs at http://localhost:5173
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|

| `/api/recommend/:userId` | GET | Top-10 recommendations for a user |

**Example request:**
```bash
curl http://localhost:3001/api/recommend/42
```

**Example response:**
```json
{
  "success": true,
  "user_idx": 42,
  "user_id": 712664,
  "source": "precomputed",
  "latency_ms": 3,
  "recommendations": [
    {
      "rank": 1,
      "movie_idx": 1834,
      "predicted_rating": 4.71,
      "title": "Lord of the Rings: Fellowship of the Ring",
      "year": 2001,
      "avg_rating": 4.42,
      "confidence": "Excellent"
    }
  ]
}
```

---

## Evaluation Protocol

**Train/test split**: 80% train / 20% test, `random_state=42`

**RMSE**: Computed on all test interactions using Surprise's native accuracy module.

**MAP@10**: Computed using a custom implementation.
- Relevance threshold: **rating ≥ 3.5**
- Per-user Top-10 list: test items ranked by predicted score descending
- AP@10 denominator: `min(10, |relevant items for user|)`
- MAP@10: mean AP@10 across all test users

**Reproducibility**: All random seeds set to `42` across `random`, `numpy`, and model constructors. Results are deterministic given the same dataset subset.

---

## Python Dependencies
numpy>=1.24.0
pandas>=2.0.0
scikit-surprise>=1.1.3
implicit>=0.7.0
scipy>=1.11.0
scikit-learn>=1.3.0
matplotlib>=3.7.0
seaborn>=0.12.0
Install all:
```bash
pip install -r notebook/requirements.txt
```

---

## Key Design Decisions

**Why subsample rather than use the full dataset?**
The full 100M+ rating dataset requires ~40GB RAM for dense matrix operations. Our density-preserving subsample (top 10K users × 5K movies) retains the statistical properties needed for latent factor models while fitting on Kaggle's 16GB RAM limit. Results generalise because we preserve relative user/item activity distributions.

**Why ALS for MAP@10 and SVD for RMSE?**
SVD minimises squared rating error during training — it is inherently an RMSE-optimal algorithm. ALS treats unobserved interactions as weak negatives, giving it a systematic ranking advantage. Both are reported honestly and the trade-off is discussed explicitly in the report.

**Why precompute Top-10 lists?**
Loading a 200MB model file per API request would make the server unusably slow. Precomputing all Top-10 lists at notebook export time reduces recommendation latency from ~2s (live inference) to ~3ms (dict lookup). The Python worker is only invoked for users not in the precomputed table.

---

## License

Dataset is subject to the original Netflix Prize Terms of Use.
