"""
{{PROJECT_NAME}} - Flask Application
"""
from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def root():
    """Root endpoint."""
    return jsonify({"message": "Hello, World!"})


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
