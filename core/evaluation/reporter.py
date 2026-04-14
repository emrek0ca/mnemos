import json
from pathlib import Path
from typing import List, Dict, Any
from loguru import logger


class HTMLReporter:
    """
    Generates a user-friendly HTML report for manual review of
    redacted data and digital twin performance.
    """

    def __init__(self, output_path: Path):
        self.output_path = output_path

    def generate_report(self, stats: Dict[str, Any], samples: List[Dict[str, Any]]):
        """
        Creates an HTML report with style statistics and chat samples.
        """
        logger.info(f"Generating HTML report at {self.output_path}")
        
        # Extract comparison if nested
        comparison = stats.get("fidelity_comparison", {})
        global_fidelity = comparison.get("global_fidelity", 0) * 100
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MNEMOS | Cognitive Fidelity Report</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {{
                    --primary: #6366f1;
                    --primary-hover: #4f46e5;
                    --bg: #0f172a;
                    --glass: rgba(30, 41, 59, 0.7);
                    --text: #f8fafc;
                    --text-secondary: #94a3b8;
                }}
                body {{
                    font-family: 'Inter', sans-serif;
                    background: radial-gradient(circle at top left, #1e1b4b, #0f172a);
                    color: var(--text);
                    line-height: 1.6;
                    margin: 0;
                    padding: 40px 20px;
                    min-height: 100vh;
                }}
                .container {{ max-width: 1000px; margin: 0 auto; }}
                header {{ text-align: center; margin-bottom: 60px; }}
                h1 {{ font-size: 3rem; font-weight: 700; margin: 0; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
                p.subtitle {{ color: var(--text-secondary); font-size: 1.1rem; }}
                
                .card {{
                    background: var(--glass);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 32px;
                    margin-bottom: 32px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
                }}
                
                .fidelity-score {{
                    font-size: 4rem;
                    font-weight: 800;
                    text-align: center;
                    margin: 20px 0;
                    background: linear-gradient(135deg, #4ade80, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }}
                
                .grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }}
                
                .stat-box {{
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 16px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: transform 0.2s;
                }}
                .stat-box:hover {{ transform: translateY(-5px); border-color: var(--primary); }}
                .stat-label {{ color: var(--text-secondary); font-size: 0.875rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }}
                .stat-val {{ font-size: 1.5rem; font-weight: 700; margin-top: 8px; color: #fff; }}
                
                .chat-list {{ display: flex; flex-direction: column; gap: 16px; }}
                .chat-bubble {{
                    background: rgba(255, 255, 255, 0.03);
                    padding: 20px;
                    border-radius: 16px;
                    border-left: 4px solid var(--primary);
                }}
                .chat-meta {{ font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600; }}
                .redacted {{ color: #fb7185; background: rgba(251, 113, 133, 0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }}
                
                .badge {{
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    background: rgba(99, 102, 241, 0.2);
                    color: #a5b4fc;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>🧠 MNEMOS</h1>
                    <p class="subtitle">Digital Twin Cognitive Fidelity Analysis</p>
                </header>

                <div class="card">
                    <div style="text-align: center;">
                        <span class="badge">Overall Style Match</span>
                        <div class="fidelity-score">{global_fidelity:.1f}%</div>
                    </div>
                </div>

                <div class="card">
                    <h2 style="margin-top:0">📊 Stylistic DNA</h2>
                    <div class="grid">
                        <div class="stat-box">
                            <div class="stat-label">Message Count</div>
                            <div class="stat-val">{stats.get('real_stats', {}).get('count', 0)}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Avg Word Split</div>
                            <div class="stat-val">{stats.get('real_stats', {}).get('avg_word_count', 0):.1f}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Lexical Diversity</div>
                            <div class="stat-val">{stats.get('real_stats', {}).get('lexical_diversity', 0):.2f}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Emoji Density</div>
                            <div class="stat-val">{stats.get('real_stats', {}).get('density_emoji', 0):.2f}</div>
                        </div>
                    </div>
                </div>

                <h2>💬 Sample Introspection</h2>
                <div class="chat-list">
                    {"".join([f'''
                    <div class="chat-bubble">
                        <div class="chat-meta">EVENT ID: {s.get('id')} // RECURRENCE DETECTED</div>
                        <div>{s.get('text').replace('********', '<span class="redacted">[PROTECTED_PII]</span>')}</div>
                    </div>
                    ''' for s in samples[:15]])}
                </div>
            </div>
        </body>
        </html>
        """
        
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        logger.success(f"Premium report generated successfully at {self.output_path}")
        
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        logger.success(f"Report generated successfully.")
