import argparse
import os
import json
from pathlib import Path
from typing import Optional
from loguru import logger

# Specialized imports for training
try:
    import torch
    from datasets import load_dataset
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
        TrainingArguments,
    )
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from trl import SFTTrainer
except ImportError as e:
    logger.warning(f"Training dependencies not found in current environment: {e}")
    logger.info("This script is intended to run in a GPU-enabled environment (e.g., Colab, Lambda Labs).")

def setup_training(args):
    """
    Initializes the model, tokenizer, and PEFT configuration.
    """
    logger.info(f"Loading tokenizer for {args.model_id}")
    tokenizer = AutoTokenizer.from_pretrained(args.model_id)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    logger.info(f"Loading model {args.model_id} with 4-bit quantization")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    model = AutoModelForCausalLM.from_pretrained(
        args.model_id,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model.config.use_cache = False
    
    model = prepare_model_for_kbit_training(model)

    peft_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    model = get_peft_model(model, peft_config)
    return model, tokenizer

def train(args):
    """
    Main training loop using SFTTrainer.
    """
    if args.dry_run:
        logger.info("DRY RUN: Verification complete. Arguments parsed correctly.")
        return

    model, tokenizer = setup_training(args)

    logger.info(f"Loading dataset from {args.dataset_path}")
    dataset = load_dataset("json", data_files=args.dataset_path, split="train")

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=2,
        optim="paged_adamw_32bit",
        save_steps=25,
        logging_steps=1,
        learning_rate=args.lr,
        weight_decay=0.001,
        fp16=True,
        bf16=False,
        max_grad_norm=0.3,
        max_steps=-1,
        warmup_ratio=0.03,
        group_by_length=True,
        lr_scheduler_type="constant",
        report_to="tensorboard",
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        peft_config=None, # Already handled by get_peft_model
        dataset_text_field="response", # This needs to match builder.py output
        max_seq_length=512,
        tokenizer=tokenizer,
        args=training_args,
        packing=False,
    )

    logger.info("Starting training...")
    trainer.train()

    final_model_path = os.path.join(args.output_dir, "final_lora_adapter")
    trainer.model.save_pretrained(final_model_path)
    logger.success(f"Training complete. Adapter saved to {final_model_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MNEMOS Fine-Tuning Script")
    parser.add_argument("--model_id", type=str, default="meta-llama/Llama-2-7b-chat-hf")
    parser.add_argument("--dataset_path", type=str, required=True)
    parser.add_argument("--output_dir", type=str, default="./artifacts/checkpoints")
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--lora_r", type=int, default=16)
    parser.add_argument("--lora_alpha", type=int, default=32)
    parser.add_argument("--dry_run", action="store_true", help="Verify setup without starting training")
    
    args = parser.parse_args()
    train(args)
