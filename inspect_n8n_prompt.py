from pathlib import Path
path = Path('n8n-mejorar-casos-flujo.json')
text = path.read_text(encoding='utf-8')
start = text.find('const systemPrompt = "Eres un QA senior. Mejora UNICAMENTE las precondiciones de un caso de prueba')
print('start=', start)
if start == -1:
    raise SystemExit('start not found')
end = text.find('const requestBody = {', start)
print('end=', end)
print(text[start:end])
