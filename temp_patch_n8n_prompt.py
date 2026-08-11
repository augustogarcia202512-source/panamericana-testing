from pathlib import Path

path = Path(r'c:\Users\ce54\OneDrive\Documentos\Proyectos\panamericana-testing-main\panamericana-testing-main\n8n-mejorar-casos-flujo.json')
lines = path.read_text(encoding='utf-8').splitlines()
updated = False
for i, line in enumerate(lines):
    if 'const systemPrompt = "Eres un QA senior. Mejora UNICAMENTE las precondiciones de un caso de prueba' in line:
        lines[i] = 'const systemPrompt = "Eres un QA senior. Mejora las precondiciones de un caso de prueba para que sean claras, concretas y necesarias antes de ejecutar el caso, y también mejora el resultado esperado para que sea preciso y verificable. No modifiques los pasos actuales. Responde UNICAMENTE con JSON valido: {\\"resultado_esperado_sugerido\\": \\\"...\\\", \\\"precondiciones_sugeridas\\\": [\\"...\\", \\\"...\\\"]}";'
        updated = True
        break
if not updated:
    raise SystemExit('systemPrompt line not found')
path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('patched')
