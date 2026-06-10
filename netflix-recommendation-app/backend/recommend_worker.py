import sys
import json
import pickle
import os
import numpy as np

def main():
    # 1. Read User ID passed from Node server arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No User ID provided to background worker"}))
        sys.exit(1)
        
    user_id = sys.argv[1]
    
    # Define absolute pathings relative to this file script
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'model.pkl')
    mapping_path = os.path.join(base_dir, 'movie_mapping.json')
    
    # 2. Safety assertions for asset dependencies
    if not os.path.exists(model_path) or not os.path.exists(mapping_path):
        print(json.dumps({"error": "Serialized ML components missing from server backend directory"}))
        sys.exit(1)
        
    # 3. Load ML model weights and movie profiles
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
        
    with open(mapping_path, 'r', encoding='utf-8') as f:
        movie_mapping = json.load(f)
    
    # 4. Resolve the user ID to an index in our model
    # Try both integer and string keys since the user might submit either
    uid_int = None
    try:
        uid_int = int(user_id)
    except ValueError:
        pass

    user_to_idx = model['user_to_idx']
    movie_to_idx = model['movie_to_idx']
    
    user_idx = None
    if uid_int is not None and uid_int in user_to_idx:
        user_idx = user_to_idx[uid_int]
    elif user_id in user_to_idx:
        user_idx = user_to_idx[user_id]
    elif str(user_id) in user_to_idx:
        user_idx = user_to_idx[str(user_id)]

    recommendations = []
    
    if user_idx is not None:
        # Known user — compute personalized scores using SVD factors
        global_mean = model['global_mean']
        user_bias = model['user_bias'][user_idx]
        user_factors = model['user_factors'][user_idx]
        
        for movie_id, movie_title in movie_mapping.items():
            if movie_id in movie_to_idx:
                m_idx = movie_to_idx[movie_id]
                predicted_rating = (
                    global_mean +
                    user_bias +
                    model['movie_bias'][m_idx] +
                    float(np.dot(user_factors, model['movie_factors'][m_idx]))
                )
                # Clamp to valid rating range
                predicted_rating = max(1.0, min(5.0, predicted_rating))
            else:
                # Movie not in model trainset — use global mean + user bias
                predicted_rating = max(1.0, min(5.0, global_mean + user_bias))

            recommendations.append({
                "movieId": str(movie_id),
                "title": movie_title,
                "predictedRating": round(float(predicted_rating), 2)
            })
    else:
        # Unknown user — use popularity-based fallback with movie biases
        # This still provides a sensible ordering (popular movies first)
        global_mean = model['global_mean']
        
        for movie_id, movie_title in movie_mapping.items():
            if movie_id in movie_to_idx:
                m_idx = movie_to_idx[movie_id]
                predicted_rating = global_mean + model['movie_bias'][m_idx]
                predicted_rating = max(1.0, min(5.0, predicted_rating))
            else:
                predicted_rating = global_mean

            recommendations.append({
                "movieId": str(movie_id),
                "title": movie_title,
                "predictedRating": round(float(predicted_rating), 2)
            })
    
    # 5. Rank items highest-to-lowest based on personalized variation
    recommendations.sort(key=lambda x: x['predictedRating'], reverse=True)
    top_10 = recommendations[:10]
    
    # Return final payload to Node stdout
    print(json.dumps(top_10))

if __name__ == '__main__':
    main()