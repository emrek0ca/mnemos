import os
from typing import List, Dict, Any
from core.cognition.skills.base_skill import BaseExpertSkill

class FrontendExpertSkill(BaseExpertSkill):
    """
    UI/UX & Design Architecture Expert.
    Analyzes HTML/CSS for aesthetic consistency, modularity, and premium responsiveness.
    """

    @property
    def name(self) -> str:
        return "Frontend Design Specialist"

    @property
    def domain(self) -> str:
        return "frontend"

    def audit(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        proposals = []
        root_dir = context.get("root_dir", ".")
        dashboard_dir = os.path.join(root_dir, "apps", "dashboard")
        
        if not os.path.exists(dashboard_dir):
            return proposals

        # 1. CSS Refinement Audit
        css_path = os.path.join(dashboard_dir, "styles.css")
        if os.path.exists(css_path):
            with open(css_path, "r") as f:
                css_content = f.read()
                
            # Heuristic: Check for CSS variables usage
            if ":root" not in css_content:
                proposals.append(self.create_proposal(
                    "Standardize Design Variables",
                    "The CSS lacks central variable definitions for colors and spacing.",
                    "Implement a :root block with unified color tokens (HLS-based preferred).",
                    "HIGH"
                ))
            
            # Heuristic: Check for hardcoded absolute dimensions in flex/grid
            if "px" in css_content and "rem" not in css_content:
                proposals.append(self.create_proposal(
                    "Relative Scaling (A11y)",
                    "Hardcoded pixel values detected. This limits accessibility scaling.",
                    "Transition to rem/em units for responsive typography and spacing.",
                    "MEDIUM"
                ))

        # 2. HTML Semantic Audit
        html_path = os.path.join(dashboard_dir, "index.html")
        if os.path.exists(html_path):
            with open(html_path, "r") as f:
                html_content = f.read()
            
            if "<main" not in html_content:
                proposals.append(self.create_proposal(
                    "Semantic HTML Restructuring",
                    "The dashboard uses generic divs instead of semantic HTML5 landmarks.",
                    "Wrap core content in <main>, <aside>, and <header> for screen reader support.",
                    "LOW"
                ))

        return proposals
