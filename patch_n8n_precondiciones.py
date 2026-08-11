from pathlib import Path
path = Path('n8n-mejorar-casos-flujo.json')
text = path.read_text(encoding='utf-8')
old = 'const systemPrompt = "Eres un QA senior. Mejora UNICAMENTE las precondiciones de un caso de prueba, hazlas claras, concretas y necesarias antes de ejecutar el caso. No modifiques los pasos ni el resultado esperado. Responde UNICAMENTE con JSON valido: {\\"precondiciones_sugeridas\\": [\\"...\\", \\\"...\\"]}";'
new = 'const systemPrompt = "Eres un QA senior. Mejora UNICAMENTE las precondiciones de un caso de prueba y, si es necesario, también su resultado esperado para que sea claro y verificable. No modifiques los pasos. Responde UNICAMENTE con JSON valido: {\\"precondiciones_sugeridas\\": [\\"...\\", \\\"...\\"], \\\"resultado_esperado_sugerido\\\": \\\"...\\\"}";'
if old not in text:
    raise SystemExit('Old snippet not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('Patched n8n prompt successfully.')
