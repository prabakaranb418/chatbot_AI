
from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "smollm2:135m"

SYSTEM_PROMPT = (
    "You are a helpful, clear, professional AI assistant. "
    "Give useful and well-structured answers."
)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    messages = data.get("messages", [])

    if not isinstance(messages, list) or not messages:
        return jsonify({"error": "Please enter a message."}), 400

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT}
        ] + messages,
        "stream": False
    }

    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=120
        )
        response.raise_for_status()

        reply = response.json()["message"]["content"]
        return jsonify({"reply": reply})

    except requests.exceptions.ConnectionError:
        return jsonify({
            "error": "Ollama is not running. Please start Ollama."
        }), 503

    except requests.exceptions.Timeout:
        return jsonify({
            "error": "The model took too long to respond."
        }), 504

    except requests.exceptions.RequestException:
        return jsonify({
            "error": "Unable to communicate with Ollama."
        }), 502

    except (KeyError, ValueError):
        return jsonify({
            "error": "Invalid response received from Ollama."
        }), 502


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
