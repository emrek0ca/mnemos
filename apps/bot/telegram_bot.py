import asyncio
from loguru import logger
from typing import Dict, List
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    ContextTypes,
    CommandHandler,
    MessageHandler,
    filters,
)

from core.cognition.agent import MnemosAgent
from core.config.settings import settings


class MnemosBot:
    """
    Production-ready Telegram Bot for interacting with the MNEMOS Digital Twin.
    """

    def __init__(self, token: str, mode: str = "baseline"):
        self.token = token
        self.mode = mode
        # Store agent per user_id to maintain distinct session state/history
        self.agents: Dict[int, MnemosAgent] = {}

    def get_agent(self, user_id: int) -> MnemosAgent:
        """Retrieves or creates an agent for a specific user."""
        if user_id not in self.agents:
            self.agents[user_id] = MnemosAgent(model_mode=self.mode)
        return self.agents[user_id]

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler for the /start command."""
        user = update.effective_user
        welcome_text = (
            f"Hello {user.first_name}! I am your MNEMOS Digital Twin.\n\n"
            "I've been configured to mimic your style and personality.\n"
            "Commands:\n"
            "/memory - See what I've learned about you\n"
            "/stats - Check my stylistic fidelity\n"
            "/reset - Clear conversation history"
        )
        await update.message.reply_text(welcome_text)

    async def memory(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Displays summarized semantic facts or procedural habits."""
        user_id = update.effective_user.id
        agent = self.get_agent(user_id)
        
        # Check if user asked for procedural specifically
        is_procedural = context.args and context.args[0].lower() == "procedural"
        
        if is_procedural:
            habits = agent.memory.procedural.get_stylistic_profile()
            if not habits:
                await update.message.reply_text("📉 I haven't detected any stable behavioral patterns yet.")
                return
            text = "🔄 **Procedural Habits (How I speak):**\n\n"
            for name, params in habits.items():
                text += f"• **{name}**: {params.get('mode', params.get('emoji_level', 'active'))}\n"
        else:
            facts = agent.memory.semantic.memories[-5:]
            if not facts:
                await update.message.reply_text("🔎 I haven't extracted any stable facts yet. Keep talking!")
                return
            text = "🧠 **Semantic Facts (What I know):**\n\n"
            for f in facts:
                text += f"• {f.content}\n"
            text += "\n_Tip: Try_ `/memory procedural` _to see behavioral patterns!_"
            
        await update.message.reply_text(text, parse_mode="Markdown")

    async def stats(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Displays detailed cognitive telemetry health report."""
        user_id = update.effective_user.id
        agent = self.get_agent(user_id)
        
        from core.utils.telemetry import telemetry
        report = telemetry.get_health_report()
        
        if report.get("status") == "initializing":
            await update.message.reply_text("📊 Telemetry initializing... Send more messages!")
            return
            
        health_emoji = "✅" if report["status"] == "healthy" else "⚠️"
        
        text = (
            f"📊 **Cognitive Health {health_emoji}**\n\n"
            f"• **Status**: {report['status'].capitalize()}\n"
            f"• **Memory Hit Rate**: {int(report['memory_hit_rate']*100)}%\n"
            f"• **Avg Latency**: {report['avg_latency_ms']}ms\n"
            f"• **Consolidations**: {report['consolidation_count']}\n"
            f"• **Facts Learned**: {report['facts_extracted']}\n\n"
            f"• **Session Turns**: {report['total_turns']}"
        )
        await update.message.reply_text(text, parse_mode="Markdown")

    async def reset(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler to clear conversation history."""
        user_id = update.effective_user.id
        agent = self.get_agent(user_id)
        agent.reset_conversation()
        await update.message.reply_text("🧠 Memory cleared. Let's start fresh!")

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Processes incoming text messages using the cognitive agent."""
        user_id = update.effective_user.id
        content = update.message.text

        if not content:
            return

        logger.info(f"Received message from user {user_id}: {content[:50]}...")
        agent = self.get_agent(user_id)

        try:
            # Generate response via full cognitive loop
            async with update.message.chat.send_action("typing"):
                # We wrap the blocking agent process in a thread for async safety
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(
                    None, agent.process, content, str(user_id)
                )
            
            await update.message.reply_text(response)
            
        except Exception as e:
            logger.error(f"Error during message handling: {e}")
            await update.message.reply_text("⚠️ Something went wrong in my cognitive engine. Please try again later.")

    def run(self):
        """Starts the bot application."""
        if not self.token:
            logger.error("No TELEGRAM_BOT_TOKEN found. Bot cannot start.")
            return

        logger.info(f"Starting MNEMOS Telegram Bot in {self.engine.mode} mode...")
        
        application = ApplicationBuilder().token(self.token).build()

        # Add Handlers
        application.add_handler(CommandHandler("start", self.start))
        application.add_handler(CommandHandler("memory", self.memory))
        application.add_handler(CommandHandler("stats", self.stats))
        application.add_handler(CommandHandler("explain", self.explain))
        application.add_handler(CommandHandler("reset", self.reset))
        application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), self.handle_message))

        application.run_polling()


if __name__ == "__main__":
    # For testing, grab token from settings or env
    token = settings.TELEGRAM_BOT_TOKEN
    bot = MnemosBot(token=token)
    bot.run()
