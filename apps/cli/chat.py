import typer
from rich.console import Console
from rich.panel import Panel
from loguru import logger

from core.inference.engine import InferenceEngine
from core.evaluation.metrics import StyleFidelityMetrics
from core.config.settings import settings

console = Console()

def start_chat(mode: str = "baseline", input_file: str = "artifacts/processed/redacted.jsonl"):
    """
    Starts an interactive chat session with the MNEMOS digital twin.
    """
    console.print(Panel(f"🧠 [bold cyan]MNEMOS - Digital Twin Chat[/] ({mode} mode)"))
    
    engine = InferenceEngine(mode=mode)
    
    if mode == "baseline":
        # Load stats for baseline
        import json
        metrics = StyleFidelityMetrics()
        with open(input_file, "r", encoding="utf-8") as f:
            texts = [json.loads(line).get("text", "") for line in f]
        stats = metrics.get_stats(texts)
        engine.setup_baseline(stats)
        console.print("[dim]Baseline persona reconstructed from style statistics.[/]")

    context = []
    
    while True:
        try:
            user_input = console.input("\n[bold green]You:[/] ")
            if user_input.lower() in ["exit", "quit", "/q"]:
                break
                
            context.append(user_input)
            
            # Keep context window small for the engine
            trimmed_context = context[-5:]
            
            with console.status("[italic]Thinking..."):
                response = engine.generate(trimmed_context)
                
            console.print(f"\n[bold magenta]Twin:[/] {response}")
            context.append(response)
            
        except KeyboardInterrupt:
            break

    console.print("\n[bold green]Chat session ended.[/]")

if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "baseline"
    start_chat(mode)
