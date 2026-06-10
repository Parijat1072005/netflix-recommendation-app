"""
Generate a trained SVD collaborative filtering model.

This creates a synthetic user-movie ratings dataset and trains an SVD model
using numpy (no external ML libraries required). The model decomposes the
user-item interaction matrix into latent factors that capture user preferences
and movie characteristics, enabling personalized predictions.

Output: model.pkl — a pickled dict containing:
  - user_factors: (n_users, k) matrix of user latent vectors
  - movie_factors: (n_movies, k) matrix of movie latent vectors
  - user_bias: per-user bias terms
  - movie_bias: per-movie bias terms
  - global_mean: global average rating
  - user_ids: list of valid user IDs
  - movie_ids: list of valid movie IDs
"""

import numpy as np
import pickle
import json
import os
import sys

def generate_synthetic_ratings(movie_ids, n_users=500, seed=42):
    """
    Generate realistic synthetic user-movie rating data.
    
    Users are assigned preference profiles (e.g., action-lover, drama-fan, etc.)
    that influence which movies they rate highly, creating natural clustering
    that SVD can discover.
    """
    rng = np.random.default_rng(seed)
    
    n_movies = len(movie_ids)
    
    # Define genre affinity profiles for movies (approximate categories)
    # Each movie gets a latent "genre vector" that determines appeal
    n_latent = 8  # Number of latent taste dimensions
    movie_profiles = rng.standard_normal((n_movies, n_latent)) * 0.5
    
    # Users get preference vectors that dot-product with movie profiles
    user_profiles = rng.standard_normal((n_users, n_latent)) * 0.5
    
    # Base affinity matrix: users x movies
    affinity = user_profiles @ movie_profiles.T  # (n_users, n_movies)
    
    # Scale to rating range [1, 5] with some noise
    ratings_raw = 3.0 + affinity + rng.normal(0, 0.3, affinity.shape)
    ratings_raw = np.clip(ratings_raw, 1.0, 5.0)
    
    # Sparsify: each user rates only ~20-60% of movies (realistic)
    ratings = []
    user_ids_list = list(range(1, n_users + 1))
    
    for u_idx, uid in enumerate(user_ids_list):
        # Each user rates a random subset of movies
        n_rated = rng.integers(int(n_movies * 0.2), int(n_movies * 0.6))
        rated_indices = rng.choice(n_movies, size=n_rated, replace=False)
        
        for m_idx in rated_indices:
            rating = round(float(ratings_raw[u_idx, m_idx]) * 2) / 2  # Round to 0.5
            rating = max(1.0, min(5.0, rating))
            ratings.append((uid, movie_ids[m_idx], rating))
    
    return ratings, user_ids_list


def train_svd(ratings, user_ids, movie_ids, n_factors=20, n_epochs=30, lr=0.005, reg=0.02):
    """
    Train an SVD model using stochastic gradient descent.
    
    Implements the SVD algorithm similar to Simon Funk's approach used in the
    Netflix Prize: rating = global_mean + user_bias + item_bias + dot(P_u, Q_i)
    """
    rng = np.random.default_rng(42)
    
    # Create ID-to-index mappings
    user_to_idx = {uid: i for i, uid in enumerate(user_ids)}
    movie_to_idx = {mid: i for i, mid in enumerate(movie_ids)}
    
    n_users = len(user_ids)
    n_movies = len(movie_ids)
    
    # Compute global mean
    global_mean = np.mean([r[2] for r in ratings])
    
    # Initialize latent factors with small random values
    P = rng.normal(0, 0.1, (n_users, n_factors))   # user factors
    Q = rng.normal(0, 0.1, (n_movies, n_factors))   # movie factors
    bu = np.zeros(n_users)   # user biases
    bi = np.zeros(n_movies)  # movie biases
    
    print(f"Training SVD model: {n_users} users, {n_movies} movies, {len(ratings)} ratings")
    print(f"Hyperparameters: {n_factors} factors, {n_epochs} epochs, lr={lr}, reg={reg}")
    
    for epoch in range(n_epochs):
        # Shuffle ratings each epoch
        indices = list(range(len(ratings)))
        rng.shuffle(indices)
        
        total_error = 0.0
        for idx in indices:
            uid, mid, rating = ratings[idx]
            u = user_to_idx[uid]
            i = movie_to_idx[mid]
            
            # Prediction
            pred = global_mean + bu[u] + bi[i] + np.dot(P[u], Q[i])
            error = rating - pred
            total_error += error ** 2
            
            # SGD updates
            bu[u] += lr * (error - reg * bu[u])
            bi[i] += lr * (error - reg * bi[i])
            
            P_u_old = P[u].copy()
            P[u] += lr * (error * Q[i] - reg * P[u])
            Q[i] += lr * (error * P_u_old - reg * Q[i])
        
        rmse = np.sqrt(total_error / len(ratings))
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"  Epoch {epoch+1}/{n_epochs} — RMSE: {rmse:.4f}")
    
    print(f"Training complete! Final RMSE: {rmse:.4f}")
    
    return {
        'user_factors': P,
        'movie_factors': Q,
        'user_bias': bu,
        'movie_bias': bi,
        'global_mean': float(global_mean),
        'user_to_idx': user_to_idx,
        'movie_to_idx': movie_to_idx,
        'user_ids': user_ids,
        'movie_ids': movie_ids,
        'n_factors': n_factors,
    }


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    mapping_path = os.path.join(base_dir, 'movie_mapping.json')
    model_path = os.path.join(base_dir, 'model.pkl')
    
    # Load movie mapping
    with open(mapping_path, 'r', encoding='utf-8') as f:
        movie_mapping = json.load(f)
    
    movie_ids = sorted(movie_mapping.keys(), key=lambda x: int(x))
    print(f"Loaded {len(movie_ids)} movies from mapping")
    
    # Generate synthetic ratings
    print("Generating synthetic user-movie ratings...")
    ratings, user_ids = generate_synthetic_ratings(movie_ids, n_users=500)
    print(f"Generated {len(ratings)} ratings from {len(user_ids)} users")
    
    # Train SVD model
    model = train_svd(ratings, user_ids, movie_ids)
    
    # Save model
    with open(model_path, 'wb') as f:
        pickle.dump(model, f, protocol=pickle.HIGHEST_PROTOCOL)
    
    file_size = os.path.getsize(model_path)
    print(f"\nModel saved to {model_path} ({file_size:,} bytes)")
    
    # Quick verification: show predictions for 3 different users
    print("\n--- Verification: Top 3 movies for different users ---")
    for test_uid in [1, 50, 200]:
        u_idx = model['user_to_idx'][test_uid]
        scores = []
        for mid in movie_ids:
            m_idx = model['movie_to_idx'][mid]
            pred = (model['global_mean'] + 
                    model['user_bias'][u_idx] + 
                    model['movie_bias'][m_idx] + 
                    np.dot(model['user_factors'][u_idx], model['movie_factors'][m_idx]))
            scores.append((mid, movie_mapping[mid], round(pred, 2)))
        scores.sort(key=lambda x: x[2], reverse=True)
        top3 = scores[:3]
        print(f"  User {test_uid}: {', '.join(f'{t[1]} ({t[2]})' for t in top3)}")


if __name__ == '__main__':
    main()
