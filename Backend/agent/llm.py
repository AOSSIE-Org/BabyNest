from llama_cpp import Llama


llm = Llama(
    model_path="./models/qwen2-0_5b-instruct-q4_k_m.gguf", 
    lora_path="./models/adapter_model.bin",               
    n_ctx=512,                                            
    n_gpu_layers=-1                                       
)

def run_llm(prompt: str) -> str:
    """Actual inference logic for medical extraction."""
    output = llm(
        prompt, 
        max_tokens=256, 
        stop=["}"], 
        temperature=0
    )
    response = output['choices'][0]['text'].strip()
    # Ensuring valid JSON structure
    return response + "}" if not response.endswith("}") else response

def prepare_prompt_for_frontend(prompt: str) -> dict:
    """Prepare prompt for future frontend Llama.rn processing."""
    return {
        "prompt": prompt,
        "max_tokens": 150,
        "temperature": 0.1,
        "system_message": "You are BabyNest, an empathetic pregnancy companion. Extract medical data into JSON."
    }