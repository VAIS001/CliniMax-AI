# app/core/prompt_loader.py

from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path

# Point Jinja2 at your prompts directory
env = Environment(
    loader=FileSystemLoader(Path("app/prompts")),
    autoescape=False  # Never autoescape — this is not HTML
)

def render_prompt(template_name: str, **variables) -> str:
    """
    Load a prompt file from app/prompts/ and inject variables.
    
    Usage:
        render_prompt("intake_prompt.md",
                      intake_template=template_str)
    """
    template = env.get_template(template_name)
    return template.render(**variables)