import React, { useState, useEffect } from 'react';
import { Film, Search, Tv, Sparkles, Loader2, AlertCircle } from 'lucide-react';

// =====================================================================
// ⚠️ PASTE YOUR TMDB API KEY HERE
// =====================================================================
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;;
// =====================================================================

// Sub-component to handle asynchronous live poster fetching per movie card
function MoviePoster({ title, movieId, index, predictedRating }) {
  const [posterUrl, setPosterUrl] = useState(null);

  useEffect(() => {
    const fetchPoster = async () => {
      if (!TMDB_API_KEY || TMDB_API_KEY.includes("YOUR_TMDB")) {
        // Fallback default image if API key isn't configured yet
        setPosterUrl("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop");
        return;
      }

      try {
        // Search TMDB for the exact movie title string
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&page=1`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0 && data.results[0].poster_path) {
          // Construct official secure configuration URL for the poster image asset
          setPosterUrl(`https://image.tmdb.org/t/p/w300${data.results[0].poster_path}`);
        } else {
          // Default backup theater image if movie title isn't found in TMDB archive
          setPosterUrl("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop");
        }
      } catch (err) {
        console.error("TMDB Poster fetch failure:", err);
        setPosterUrl("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop");
      }
    };

    fetchPoster();
  }, [title]);

  return (
    <div className="relative h-56 w-full overflow-hidden border-b border-zinc-800 bg-zinc-950">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-zinc-700 animate-spin" />
        </div>
      )}

      {/* Cinematic Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-40" />

      {/* Leaderboard Rank Index Badge */}
      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md font-mono text-xs text-zinc-300 h-6 w-6 rounded-md flex items-center justify-center font-bold border border-zinc-700/50 shadow-md">
        {index + 1}
      </div>

      {/* Dynamic SVD Predicted Rating Badge */}
      <div className="absolute bottom-2 right-2 bg-red-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-md tracking-wider shadow-md">
        ★ {predictedRating}
      </div>
    </div>
  );
}

export default function RecommendationHub() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const quickTestUsers = ['1', '42', '150', '375'];

  const fetchRecommendations = async (targetId) => {
    const idToSearch = targetId || userId;
    if (!idToSearch.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://netflix-recommendation-app.onrender.com/api/recommend/${idToSearch.trim()}`);
      if (!response.ok) throw new Error('Failed to compute recommendations for this User profile ID');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred connecting to server engines.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#141414]/95 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-7 w-7 text-red-600 fill-red-600" />
          <span className="text-2xl font-black tracking-tighter text-red-600">CINEMA<span className="text-white font-light">MIND</span></span>
        </div>

      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-10">
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-zinc-900 via-[#1c1c1c] to-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Personalized Streaming Discovery <Sparkles className="h-5 w-5 text-amber-400 fill-amber-400 animate-pulse" />
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Input a User ID historical record from the benchmark Netflix Prize Dataset. Our micro-service will trigger live matrix factor dot-products to predict scoring metrics over unseen interaction sets[cite: 34, 38].
            </p>
          </div>

          {/* Form Actions Input */}
          <div className="w-full md:w-auto space-y-3 min-w-[320px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter User Profile ID..."
                className="w-full bg-zinc-950/80 text-white placeholder-zinc-500 text-sm font-medium border border-zinc-700 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchRecommendations()}
              />
              <button
                onClick={() => fetchRecommendations()}
                disabled={loading}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Quick Select:</span>
              {quickTestUsers.map((id) => (
                <button
                  key={id}
                  onClick={() => { setUserId(id); fetchRecommendations(id); }}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-xs px-2.5 py-1 rounded-md text-zinc-300 font-medium transition-colors"
                >
                  ID: {id}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Loading and Error states */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
            <p className="text-sm text-zinc-400 animate-pulse font-medium">Spawning Python model framework worker, ranking target data arrays...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Server Integration Fault</h4>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Main Recommendations Grid Card Mapping */}
        {data && !loading && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Tv className="h-5 w-5 text-red-500" /> Recommendations Generated for Profile #{data.userId}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Pipeline Core: {data.source}</p>
              </div>
              <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-mono font-semibold self-start sm:self-center">
                Inference Latency: Stable OK
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {data.recommendations.map((movie, index) => (
                <div
                  key={movie.movieId}
                  className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800/80 hover:border-zinc-700 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Async Movie Poster Component */}
                  <MoviePoster
                    title={movie.title}
                    movieId={movie.movieId}
                    index={index}
                    predictedRating={movie.predictedRating}
                  />

                  {/* Item Description Metadata blocks */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <h3 className="font-bold text-xs text-zinc-100 group-hover:text-white line-clamp-2 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="text-[10px] text-zinc-500 font-semibold tracking-tight">
                      Asset ID Reference: {movie.movieId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 bg-[#0e0e0e] py-6 text-center text-xs text-zinc-600 font-medium">
        Designed for Netflix Open Challenge Analytics Portfolio Evaluation[cite: 6]. Powered by Node.js & Machine Learning Runtimes.
      </footer>
    </div>
  );
}