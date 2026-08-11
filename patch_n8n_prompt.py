from pathlib import Path
path = Path('n8n-mejorar-casos-flujo.json')
text = path.read_text(encoding='utf-8')
old = 'const systemPrompt = "Eres un QA senior. Mejora UNICAMENTE las precondiciones de un caso de prueba, hazlas claras, concretas y necesarias antes de ejecutar el caso. No modifiques los pasos ni el resultado esperado. Responde UNICAMENTE con JSON valido: {\\"precondiciones_sugeridas\\": [\\"...\\", \\\"...\\\"]}";'
new = 'const systemPrompt = "Eres un QA senior. Mejora UNICAMENTE las precondiciones de un caso de prueba y su resultado esperado sugerido, hazlos claros, concretos y necesarios antes de ejecutar el caso. No modifiques los pasos. Responde UNICAMENTE con JSON valido: {\\"resultado_esperado_sugerido\\": \\\"...\\\", \\\"precondiciones_sugeridas\\\": [\\"...\\", \\\"...\\\"]}";'
if old not in text:
    print('OLD snippet not found')
    snippet_start = text.find('const systemPrompt = "Eres un QA senior. Mejora UNICAMENTE las precondiciones de un caso de prueba')
    print('snippet_start=', snippet_start)
    print(text[snippet_start:snippet_start+400])
    raise SystemExit(1)
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('patched')
