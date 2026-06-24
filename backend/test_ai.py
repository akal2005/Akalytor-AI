import google.generativeai as genai
import os
import json

genai.configure(api_key=os.environ.get('GEMINI_API_KEY', ''))
model = genai.GenerativeModel('gemini-flash-latest')

prompt = """
You are MONI AI, the omniscient Personal Life Assistant. 
The user's name is Manikandan. Today is Friday, June 12, 2026.
Context about their life:
- Notes: 0
- Active Tasks: 2
- Recent Expenses: $0.00

Answer concisely, friendly, and intelligently based on this context. Keep the tone very futuristic and smart.

ACTION COMMANDS:
If the user explicitly asks you to create, add, schedule, or log an item, you MUST execute it by outputting a special command block at the VERY END of your response.
DO NOT use markdown formatting for the command block. It must start with ||CMD_ and end with ||.
- Task: ||CMD_ADD_TASK: {"task_name": "...", "project_name": "General", "deadline": "2026-06-12 18:00:00"}||
- Expense: ||CMD_ADD_EXPENSE: {"amount": 10.50, "category": "Food", "description": "..."}||
- Note: ||CMD_ADD_NOTE: {"title": "...", "content": "..."}||
- Reminder: ||CMD_ADD_REMINDER: {"title": "...", "due_date": "2026-06-12 18:00:00"}||

Always confirm to the user what you are doing in normal text BEFORE the command block. Do not mention the command block format to the user.
User's query: Remind me to call Mom tomorrow morning
"""

response = model.generate_content(prompt, stream=True)
full = ""
for chunk in response:
    print('CHUNK:', repr(chunk.text))
    full += chunk.text

print("--- FULL RESPONSE ---")
print(full)
