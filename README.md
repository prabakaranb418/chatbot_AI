# AI Chatbox UI

This UI is designed for the existing Flask API in `app.py`:
- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/<chat_id>`
- `POST /api/chat`

## Folder structure

Place these folders beside your existing `app.py`:

```text
your_project/
├── app.py
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Run

1. Copy `templates` and `static` into the same folder as `app.py`.
2. Ensure MySQL is running and the `ai_chatbox` database exists.
3. Install dependencies in your active Python environment:
   `pip install flask requests mysql-connector-python`
4. Ensure Ollama is running and the configured model is available:
   `ollama pull smollm2:135m`
5. Run:
   `python app.py`
6. Open `http://127.0.0.1:5000`.

The UI calls the existing API endpoints; it does not replace your backend. Keep database credentials private and avoid committing them to a public repository.
