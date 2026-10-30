# Praba AI

A local AI chat web app. A Flask backend sends your conversation to a language model running on your own computer through [Ollama](https://ollama.com/), and a plain HTML/CSS/JavaScript interface shows the chat.

No cloud API and no API key are needed. Your messages stay on your machine.

## Features

- Chat with a local model (default: `smollm2:135m`)
- Conversation context: the full chat is sent with every request, so follow-up questions work
- Conversation history saved in your browser (`localStorage`), with a recent-conversations list
- New conversation, delete one conversation, and clear all history
- Quick-start prompt cards on the welcome screen
- Typing indicator, toast messages and clear error messages in the chat
- Enter sends, Shift + Enter adds a new line, and the input grows as you type
- Responsive layout with a collapsible sidebar on small screens

## How it works

```
Browser (static/script.js)  ->  POST /api/chat  ->  Flask (app.py)  ->  Ollama (localhost:11434)
```

- The server keeps no chat data. The browser stores the history and sends the whole message list on each request.
- `app.py` adds a short system prompt, calls Ollama's `/api/chat` endpoint with `stream: false`, and returns the reply as JSON.
- There is no database.

## Project structure

```
praba chatbox/
├── app.py              Flask server and /api/chat route
├── README.md
├── templates/
│   └── index.html      Page layout
└── static/
    ├── style.css       Styling
    └── script.js       Chat logic and browser-side history
```

## Requirements

- Python 3
- [Ollama](https://ollama.com/) installed and running
- A pulled Ollama model (the default is a very small one)

## Run it

1. Pull the model:

   ```bash
   ollama pull smollm2:135m
   ```

2. Install the packages:

   ```bash
   pip install flask requests
   ```

3. Start the app (Ollama must be running; run `ollama serve` if it is not):

   ```bash
   python app.py
   ```

4. Open http://127.0.0.1:5000

## Change the model

Edit these lines at the top of `app.py`:

```python
OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "smollm2:135m"
```

Pull any other model with `ollama pull <name>` and put its name in `MODEL`. Larger models give better answers but need more memory and respond more slowly. You can also change `SYSTEM_PROMPT` to change how the assistant behaves.

## API

### `GET /`
Returns the chat page.

### `POST /api/chat`

Request:

```json
{ "messages": [ { "role": "user", "content": "Hello" } ] }
```

Success response:

```json
{ "reply": "Hi! How can I help you today?" }
```

Error responses are `{ "error": "..." }` with these status codes:

| Status | Meaning |
|--------|---------|
| 400 | No message was sent |
| 502 | Ollama could not be reached properly, or it returned an invalid response |
| 503 | Ollama is not running |
| 504 | The model took longer than 120 seconds |

## Things to know

- **History is per browser.** It is stored in this browser's `localStorage`. Clearing site data or using another browser or device starts with an empty history.
- **Small model, simple answers.** `smollm2:135m` is chosen so the app runs on almost any computer. Expect basic answers; use a larger model for better quality.
- **Long chats get slower**, because the whole conversation is sent each time.
- **Development server only.** `app.py` runs Flask in debug mode on `127.0.0.1`. Do not expose it to the internet. For a real deployment, use a production server such as gunicorn and add authentication.
