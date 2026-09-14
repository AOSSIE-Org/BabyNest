SYSTEM_MESSAGE = (
    "You are BabyNest, an empathetic pregnancy companion providing "
    "personalized, evidence-based guidance."
)


def prepare_prompt_for_frontend(prompt: str) -> dict:
    """Prepare backend-generated context for frontend Llama.rn inference."""
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("Prompt must be a non-empty string")

    return {
        "requires_frontend_inference": True,
        "prompt": prompt,
        "system_message": SYSTEM_MESSAGE,
    }
