import re
import emoji
import numpy as np
from typing import List, Dict, Any
from collections import Counter


class StyleFidelityMetrics:
    """
    Analyzes stylistic similarity between real and generated messages.
    """

    def get_stats(self, texts: List[str]) -> Dict[str, Any]:
        """Calculates stylistic statistics for a list of texts."""
        if not texts:
            return {}

        lengths = [len(t) for t in texts]
        words = [t.split() for t in texts]
        all_words = [w for s in words for w in s]
        
        punctuation_patterns = {
            "exclamation": r"!",
            "question": r"\?",
            "ellipsis": r"\.\.\.",
            "dot": r"\.",
        }

        stats = {
            "count": len(texts),
            "length_mean": float(np.mean(lengths)),
            "length_std": float(np.std(lengths)),
            "avg_word_count": float(np.mean([len(w) for w in words])),
            "lexical_diversity": float(len(set(all_words)) / len(all_words)) if all_words else 0.0,
        }

        # Punctuation Densities
        for name, pattern in punctuation_patterns.items():
            counts = [len(re.findall(pattern, t)) for t in texts]
            stats[f"density_{name}"] = float(np.mean(counts))

        # Emoji Density
        emoji_counts = [emoji.emoji_count(t) for t in texts]
        stats["density_emoji"] = float(np.mean(emoji_counts))

        return stats

    def analyze_drift(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes stylistic shifts over time.
        Records must have 'date' (ISO string) and 'text' fields.
        """
        if not records:
            return {}

        import iso8601
        from collections import defaultdict
        
        # Bucket by month
        buckets = defaultdict(list)
        for r in records:
            try:
                dt = iso8601.parse_date(r["date"])
                month_key = dt.strftime("%Y-%m")
                buckets[month_key].append(r["text"])
            except Exception:
                continue

        drift_report = {}
        sorted_months = sorted(buckets.keys())
        
        baseline_month = sorted_months[0]
        baseline_stats = self.get_stats(buckets[baseline_month])
        
        drift_report["timeline"] = []
        for month in sorted_months:
            month_stats = self.get_stats(buckets[month])
            # Compare vs baseline
            delta = {}
            for k in ["length_mean", "density_emoji", "lexical_diversity"]:
                b_val = baseline_stats.get(k, 0)
                m_val = month_stats.get(k, 0)
                change = (m_val - b_val) / b_val if b_val != 0 else 0
                delta[k] = {"value": m_val, "delta_from_start": round(change, 4)}
                
            drift_report["timeline"].append({
                "month": month,
                "message_count": len(buckets[month]),
                "metrics": delta
            })

        return drift_report

    def compare(self, real_texts: List[str], generated_texts: List[str]) -> Dict[str, Any]:
        """Compares two sets of texts and returns similarity scores."""
        real_stats = self.get_stats(real_texts)
        gen_stats = self.get_stats(generated_texts)

        comparisons = {}
        metrics_to_compare = [
            "length_mean", "avg_word_count", "density_exclamation", 
            "density_question", "density_ellipsis", "density_emoji",
            "lexical_diversity"
        ]

        for m in metrics_to_compare:
            r_val = real_stats.get(m, 0)
            g_val = gen_stats.get(m, 0)
            # Similarity = 1 - relative difference (clamped at 0)
            if r_val == 0:
                similarity = 1.0 if g_val == 0 else 0.0
            else:
                similarity = max(0.0, 1.0 - abs(r_val - g_val) / r_val)
            
            comparisons[f"{m}_similarity"] = similarity

        # Semantic Similarity (Real calculation using embeddings)
        try:
            from sentence_transformers import SentenceTransformer
            from sklearn.metrics.pairwise import cosine_similarity
            
            model = SentenceTransformer("all-MiniLM-L6-v2")
            
            # Use random samples for performance if datasets are large
            sample_size = min(50, len(real_texts), len(generated_texts))
            import random
            r_sample = random.sample(real_texts, sample_size)
            g_sample = random.sample(generated_texts, sample_size)
            
            r_emb = model.encode(r_sample)
            g_emb = model.encode(g_sample)
            
            # Global semantic overlap
            sim_matrix = cosine_similarity(r_emb, g_emb)
            # We take the mean of max similarities for each generated message (best match)
            semantic_score = float(np.mean(np.max(sim_matrix, axis=0)))
            
        except Exception as e:
            logger.warning(f"Semantic comparison failed: {e}")
            semantic_score = 0.5 # Default fallback

        comparisons["semantic_consistency"] = semantic_score

        # Global Fidelity Score (Average of all similarities)
        comparisons["global_fidelity"] = float(np.mean(list(comparisons.values())))

        return {
            "real_stats": real_stats,
            "generated_stats": gen_stats,
            "fidelity_comparison": comparisons
        }
