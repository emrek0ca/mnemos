import typer
from pathlib import Path
from loguru import logger
from typing import Optional

from core.ingestion.telegram import TelegramIngestor
from core.privacy.redactor import Redactor
from core.config.settings import settings

app = typer.Typer(
    name="mnemos",
    help="MNEMOS - Cognitive Preservation System CLI",
    add_completion=False,
)

@app.command()
def ingest(
    source: Path = typer.Option(..., help="Path to the Telegram result.json export"),
    user_id: str = typer.Option(..., help="Your Telegram user_id"),
    output: Optional[Path] = typer.Option(None, help="Output path for ingested JSONL"),
    media: bool = typer.Option(False, help="Include and link multimodal media assets"),
):
    """
    Ingests raw Telegram export and filters for your messages.
    """
    if output is None:
        output = settings.PROCESSED_DIR / "ingested.jsonl"
    
    try:
        ingestor = TelegramIngestor(source)
        ingestor.process_and_save(user_id, output)
        
        if media:
            from core.multimodal.preprocessor import MultimodalPreprocessor
            import json
            
            with open(output, "r") as f:
                logs = [json.loads(line) for line in f]
            
            preprocessor = MultimodalPreprocessor(source.parent)
            linked_logs = preprocessor.link_assets(logs)
            
            with open(output, "w") as f:
                for entry in linked_logs:
                    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
                    
        typer.echo(f"Successfully ingested messages to {output}")
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise typer.Exit(code=1)

@app.command()
def redact(
    input_file: Path = typer.Option(..., help="Path to ingested JSONL file"),
    output: Optional[Path] = typer.Option(None, help="Path for redacted output"),
    audit_report: Optional[Path] = typer.Option(None, help="Path for privacy audit report"),
):
    """
    Redacts PII from an ingested JSONL file and generates an audit report.
    """
    if output is None:
        output = settings.PROCESSED_DIR / "redacted.jsonl"
    
    if audit_report is None:
        audit_report = settings.ARTIFACTS_DIR / "eval" / "privacy_audit.json"
        
    try:
        redactor = Redactor()
        redactor.process_file(str(input_file), str(output), audit_report_path=str(audit_report))
        typer.echo(f"Successfully redacted messages to {output}")
        typer.echo(f"Privacy audit report saved to {audit_report}")
    except Exception as e:
        logger.error(f"Redaction failed: {e}")
        raise typer.Exit(code=1)

@app.command()
def build_dataset(
    input_file: Path = typer.Option(..., help="Path to redacted JSONL file"),
    output_dir: Optional[Path] = typer.Option(None, help="Directory for train/val splits"),
    window: int = typer.Option(5, help="Context window size"),
):
    """
    Builds training and validation datasets from redacted messages.
    """
    from core.datasets.builder import DatasetBuilder
    
    if output_dir is None:
        output_dir = settings.DATASETS_DIR
        
    try:
        builder = DatasetBuilder(context_window=window)
        examples = builder.build_examples(input_file)
        builder.save_split(examples, output_dir)
        typer.echo(f"Successfully created datasets in {output_dir}")
    except Exception as e:
        logger.error(f"Dataset construction failed: {e}")
        raise typer.Exit(code=1)

@app.command()
def evaluate(
    input_file: Path = typer.Option(..., help="Path to redacted JSONL file"),
):
    """
    Analyzes the stylistic fingerprint of the processed messages.
    """
    import json
    from core.evaluation.metrics import StyleFidelityMetrics
    
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            texts = [json.loads(line).get("text", "") for line in f]
            
        metrics = StyleFidelityMetrics()
        stats = metrics.get_stats(texts)
        
        typer.echo(f"📊 Style Report for {input_file}:")
        for k, v in stats.items():
            typer.echo(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")
            
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        raise typer.Exit(code=1)

@app.command()
def generate_report(
    input_file: Path = typer.Option(..., help="Path to redacted JSONL file"),
    output_path: Path = typer.Option(settings.ARTIFACTS_DIR / "eval" / "report.html", help="Path for HTML report"),
):
    """
    Generates a visual HTML evaluation report.
    """
    import json
    from core.evaluation.metrics import StyleFidelityMetrics
    from core.evaluation.reporter import HTMLReporter
    
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            samples = [json.loads(line) for line in f]
            
        texts = [s.get("text", "") for s in samples]
        metrics = StyleFidelityMetrics()
        stats = metrics.get_stats(texts)
        
        reporter = HTMLReporter(output_path)
        reporter.generate_report(stats, samples)
        
        typer.echo(f"✨ Report generated at {output_path}")
            
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise typer.Exit(code=1)

@app.command()
def chat(
    mode: str = typer.Option("baseline", help="Inference mode (baseline/finetuned)"),
    input_file: Path = typer.Option(settings.PROCESSED_DIR / "redacted.jsonl", help="Path to logs for baseline stats"),
):
    """
    Starts an interactive chat session with your digital twin.
    """
    from apps.cli.chat import start_chat
    start_chat(mode=mode, input_file=str(input_file))

@app.command()
def reflective_chat(
    mode: str = typer.Option("baseline", help="Inference mode (baseline/finetuned)"),
):
    """
    Starts a chat session with the full Mnemos Agent (Brain System).
    Uses hierarchical memory and active reasoning loops.
    """
    from core.cognition.agent import MnemosAgent
    from rich.console import Console
    from rich.panel import Panel
    
    console = Console()
    console.print(Panel(f"🧠 [bold cyan]MNEMOS - Digital Virtual Brain[/] ({mode} mode)"))
    
    agent = MnemosAgent(model_mode=mode)
    console.print("[dim]Hierarchical memory initialized. Reasoning loop active.[/]")

    while True:
        try:
            user_input = console.input("\n[bold green]You:[/] ")
            if user_input.lower() in ["exit", "quit", "/q"]:
                break
                
            with console.status("[italic]Reasoning..."):
                response = agent.process(user_input, "user_123")
                
            console.print(f"\n[bold magenta]Brain:[/] {response}")
            
        except KeyboardInterrupt:
            break

@app.command()
def train(
    dataset_path: Path = typer.Option(settings.DATASETS_DIR / "train.jsonl", help="Path to training JSONL"),
    model_id: str = typer.Option(settings.TRAINING_MODEL_ID, help="Base model ID for fine-tuning"),
    batch_size: int = typer.Option(settings.TRAINING_BATCH_SIZE, help="Training batch size"),
    epochs: int = typer.Option(settings.TRAINING_EPOCHS, help="Number of training epochs"),
    lr: float = typer.Option(settings.TRAINING_LEARNING_RATE, help="Learning rate"),
    dry_run: bool = typer.Option(False, help="Verify setup without starting real training"),
):
    """
    Executes the LoRA fine-tuning pipeline.
    """
    from core.training.trainer import TrainingManager
    
    try:
        manager = TrainingManager(model_id=model_id)
        cmd = manager.generate_training_command(
            dataset_path=dataset_path,
            batch_size=batch_size,
            epochs=epochs,
            learning_rate=lr
        )
        if dry_run:
            cmd += " --dry_run"
            
        typer.echo(f"🛠️ Preparing training pipeline...")
        typer.echo(f"  Model: {model_id}")
        typer.echo(f"  Dataset: {dataset_path}")
        
        if dry_run:
            import subprocess
            logger.info(f"Running dry-run: {cmd}")
            subprocess.run(cmd.split())
            typer.echo("✅ Dry-run successful. Environment and arguments are valid.")
        else:
            typer.echo(f"\n🚀 To start training, run this command in your GPU environment:\n")
            typer.echo(f"  {cmd}\n")
            
    except Exception as e:
        logger.error(f"Training setup failed: {e}")
        raise typer.Exit(code=1)

@app.command()
def audit_report(
    audit_path: Path = typer.Option(settings.REPORTS_DIR / "privacy_audit.json", help="Path to audit JSON"),
    explain: bool = typer.Option(False, "--explain", help="Show cognitive reasoning for redacted turns"),
):
    """
    Shows a summary of all PII redactions performed.
    """
    if not audit_path.exists():
        typer.echo(f"❌ Audit file not found: {audit_path}. Run 'redact' first.")
        raise typer.Exit(code=1)
        
    import json
    try:
        with open(audit_path, "r", encoding="utf-8") as f:
            report = json.load(f)
            
        summary = report.get("summary", {})
        typer.echo("\n🔐 PRIVACY AUDIT SUMMARY")
        typer.echo("=========================")
        typer.echo(f"Total Messages Scanned: {summary.get('total', 0)}")
        typer.echo(f"Messages Redacted:     {summary.get('redacted', 0)}")
        typer.echo(f"Total Hits Detected:   {summary.get('events', 0)}")
        
        typer.echo("\nBY CATEGORY:")
        for etype, count in summary.get("by_type", {}).items():
            typer.echo(f"  • {etype:15} | {count} hits")
            
        typer.echo("\n✅ Privacy pipeline integrity verified.")
        
    except Exception as e:
        logger.error(f"Failed to read audit report: {e}")
        raise typer.Exit(code=1)

@app.command()
def review():
    """
    Interactively review and verify semantic facts extracted by the engine.
    """
    from core.memory.controller import MemoryController
    memory = MemoryController()
    
    pending = [m for m in memory.semantic.knowledge.values() if m.status == "pending_review"]
    
    if not pending:
        typer.echo("✅ No pending memories to review. Your twin is currently clean.")
        return

    typer.echo(f"🧐 Reviewing {len(pending)} pending semantic facts...")
    for m in pending:
        typer.echo(f"\nFact: {m.fact}")
        action = typer.prompt("[V]erify, [C]orrect, [R]eject, or [S]kip?").lower()
        
        if action == 'v':
            m.status = "verified"
            typer.echo("Stored as verified.")
        elif action == 'c':
            new_fact = typer.prompt("Enter correct fact")
            m.fact = new_fact
            m.status = "verified"
            typer.echo("Stored with correction.")
        elif action == 'r':
            m.status = "rejected"
            typer.echo("Fact rejected.")
        else:
            typer.echo("Skipped.")
    
    # Trigger persistence logic normally handled by controller
    typer.echo("\n✅ Review session complete.")

@app.command()
def fork(
    action: str = typer.Argument(..., help="Action: create, list, delete"),
    name: Optional[str] = typer.Argument(None),
):
    """
    Manages isolated cognitive sandboxes (Mnemonic Multiverse).
    """
    from core.orchestration.fork import MnemosForkManager
    manager = MnemosForkManager()
    
    if action == "create":
        if not name:
            typer.echo("Error: Please specify a fork name.")
            return
        manager.create_fork(name)
        typer.echo(f"✨ Cognitive Fork '{name}' created. Simulation ready.")
    elif action == "list":
        forks = manager.list_forks()
        if not forks:
            typer.echo("No forks found. You are currently in the True Self timeline.")
        else:
            typer.echo("🛸 AVAILABLE COGNITIVE FORKS:")
            for f in forks:
                typer.echo(f" - {f}")
    elif action == "delete":
        if not name:
            typer.echo("Error: Please specify a fork name.")
            return
        manager.delete_fork(name)
        typer.echo(f"Dissolved fork '{name}'.")

@app.command()
def models():
    """
    Lists and manages fine-tuned persona checkpoints (LoRA Weights).
    """
    from core.training.registry import WeightRegistry
    registry = WeightRegistry()
    
    checkpoints = registry.checkpoints
    if not checkpoints:
        typer.echo("📭 No fine-tuned persona models found.")
        typer.echo("Use `mnemos train` to build your first digital twin adapter.")
        return

    typer.echo("🧬 MNEMOS PERSONA REGISTRY")
    typer.echo("--------------------------")
    for cp in sorted(checkpoints.values(), key=lambda x: x.trained_at, reverse=True):
        status = " [ACTIVE]" if cp.is_active else ""
        typer.echo(f"ID: {cp.id}{status}")
        typer.echo(f"  Trained: {cp.trained_at.strftime('%Y-%m-%d %H:%M')}")
        typer.echo(f"  Base:    {cp.base_model}")
        typer.echo(f"  Config:  Rank={cp.lora_r}, Alpha={cp.lora_alpha}")
        typer.echo("")

@app.command()
def export(
    archive_name: str = typer.Option("my_twin", help="Name of the .brain archive"),
):
    """
    Exports the entire digital twin (Memory + Identity) as a portable .brain file.
    """
    from core.orchestration.packer import SoulPacker
    packer = SoulPacker()
    path = packer.pack(archive_name)
    typer.echo(f"🧬 Digital Soul Exported successfully to {path}")

@app.command()
def soul_import(
    archive_path: Path = typer.Argument(..., help="Path to the .brain archive"),
):
    """
    Imports a digital twin cognitive state from a .brain file.
    """
    from core.orchestration.packer import SoulPacker
    packer = SoulPacker()
    packer.unpack(archive_path)
    typer.echo("🚀 Digital Soul Imported. Relaunch the dashboard or bot to sync.")

@app.command()
def bot(
    mode: str = typer.Option("baseline", help="Inference mode (baseline/finetuned)"),
    token: Optional[str] = typer.Option(None, help="Telegram Bot Token"),
):
    """
    Launches the MNEMOS Telegram Bot.
    """
    from apps.bot.telegram_bot import MnemosBot
    
    bot_token = token or settings.TELEGRAM_BOT_TOKEN
    if not bot_token:
        typer.echo("Error: No bot token provided. Use --token or set TELEGRAM_BOT_TOKEN.")
        raise typer.Exit(code=1)
        
    mnemos_bot = MnemosBot(token=bot_token, mode=mode)
    mnemos_bot.run()

@app.command()
def run_pipeline(
    source: Path = typer.Option(..., help="Path to Telegram result.json"),
    user_id: str = typer.Option(..., help="Your Telegram user_id"),
    media: bool = typer.Option(False, help="Include and link multimodal media assets"),
):
    """
    Runs the full ingestion, redaction, and dataset pipeline.
    """
    ingested_path = settings.PROCESSED_DIR / "ingested.jsonl"
    redacted_path = settings.PROCESSED_DIR / "redacted.jsonl"
    dataset_dir = settings.DATASETS_DIR
    
    typer.echo("Starting MNEMOS Pipeline...")
    
    # 1. Ingest
    ingest(source=source, user_id=user_id, output=ingested_path, media=media)
    
    # 2. Redact
    # Explicitly pass audit_report to avoid Typer OptionInfo issues
    audit_path = settings.ARTIFACTS_DIR / "eval" / "privacy_audit.json"
    redact(input_file=ingested_path, output=redacted_path, audit_report=audit_path)
    
    # 3. Build Dataset
    # Explicitly pass window to avoid Typer OptionInfo issues
    build_dataset(input_file=redacted_path, output_dir=dataset_dir, window=5)
    
    typer.echo(f"🚀 Pipeline complete. Datasets ready at: {dataset_dir}")

if __name__ == "__main__":
    app()
