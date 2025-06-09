from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)
openai.api_key = ''

DB_PATH = 'corplife.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS mood (id INTEGER PRIMARY KEY, user TEXT, mood TEXT, timestamp TEXT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS poll (id INTEGER PRIMARY KEY, question TEXT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS poll_option (id INTEGER PRIMARY KEY, poll_id INTEGER, option TEXT, votes INTEGER DEFAULT 0)''')
        c.execute('''CREATE TABLE IF NOT EXISTS shame (
            id INTEGER PRIMARY KEY, 
            distraction TEXT, 
            votes INTEGER DEFAULT 0, 
            user_id INTEGER
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')
        c.execute("INSERT OR IGNORE INTO users (username, password) VALUES ('kaustubh', 'test@123')")
        conn.commit()

@app.route('/mood', methods=['POST'])
def post_mood():
    data = request.json
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("INSERT INTO mood (user, mood, timestamp) VALUES (?, ?, ?)",
                  (data['user'], data['mood'], datetime.now().isoformat()))
        conn.commit()
    return {'status': 'success'}

@app.route('/moods', methods=['GET'])
def get_moods():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT user, mood, timestamp FROM mood ORDER BY timestamp DESC")
        rows = c.fetchall()
    return jsonify([{'user': r[0], 'mood': r[1], 'timestamp': r[2]} for r in rows])

@app.route('/moodbot', methods=['GET'])
def moodbot():
    text = request.args.get('text')
    client = openai.OpenAI(api_key=openai.api_key)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": text}]
    )
    return jsonify({"reply": response['choices'][0]['message']['content']})

@app.route('/poll', methods=['POST'])
def create_poll():
    data = request.json
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("INSERT INTO poll (question) VALUES (?)", (data['question'],))
        poll_id = c.lastrowid
        for option in data['options']:
            c.execute("INSERT INTO poll_option (poll_id, option) VALUES (?, ?)", (poll_id, option))
        conn.commit()
    return {'status': 'poll created'}

@app.route('/poll/vote', methods=['POST'])
def vote():
    option_id = request.json['option_id']
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("UPDATE poll_option SET votes = votes + 1 WHERE id = ?", (option_id,))
        conn.commit()
    return {'status': 'voted'}

@app.route('/poll/results', methods=['GET'])
def poll_results():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT id, question FROM poll ORDER BY id DESC LIMIT 1")
        poll = c.fetchone()
        if poll is None:
            return jsonify({'question': None, 'options': []})
        c.execute("SELECT id, option, votes FROM poll_option WHERE poll_id = ?", (poll[0],))
        options = c.fetchall()
    return jsonify({'question': poll[1], 'options': [{'id': o[0], 'option': o[1], 'votes': o[2]} for o in options]})

@app.route('/polls', methods=['GET'])
def get_polls():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT id, question FROM poll ORDER BY id DESC")
        polls = c.fetchall()
        result = []
        for poll in polls:
            c.execute("SELECT id, option, votes FROM poll_option WHERE poll_id = ?", (poll[0],))
            options = c.fetchall()
            result.append({
                'id': poll[0],
                'question': poll[1],
                'options': [{'id': o[0], 'option': o[1], 'votes': o[2]} for o in options]
            })
    return jsonify(result)

@app.route('/shame', methods=['POST'])
def log_shame():
    data = request.json
    distraction = data.get('distraction')
    user_id = data.get('user_id')  # Expecting user_id from the frontend

    if not distraction or not user_id:
        return {'status': 'failure', 'message': 'Distraction and user ID are required'}, 400

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        # Check if the distraction already exists
        c.execute("SELECT id FROM shame WHERE distraction = ?", (distraction,))
        result = c.fetchone()
        if result:
            # Increment votes if the distraction already exists
            c.execute("UPDATE shame SET votes = votes + 1 WHERE id = ?", (result[0],))
        else:
            # Insert a new distraction with the user_id
            c.execute("INSERT INTO shame (distraction, votes, user_id) VALUES (?, 1, ?)", (distraction, user_id))
        conn.commit()

    return {'status': 'success', 'message': 'Distraction logged'}

@app.route('/shame/vote', methods=['POST'])
def vote_shame():
    data = request.json
    shame_id = data.get('id')
    if not shame_id:
        return {'status': 'failure', 'message': 'Shame ID is required'}, 400

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("UPDATE shame SET votes = votes + 1 WHERE id = ?", (shame_id,))
        conn.commit()

    return {'status': 'success', 'message': 'Vote added'}

@app.route('/shame/leaderboard', methods=['GET'])
def shame_board():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT id, distraction, votes, user_id FROM shame ORDER BY votes DESC")
        rows = c.fetchall()
    return jsonify([{'id': r[0], 'distraction': r[1], 'votes': r[2], 'user_id': r[3]} for r in rows])

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    print(f"username: {username}, password: {password}")  # Debugging line
    if not username or not password:
        return {'status': 'failure', 'message': 'Username and password are required'}, 400

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT password FROM users WHERE username = ?", (username,))
        row = c.fetchone()

    if row and row[0] == password:
        return {'status': 'success', 'message': 'Login successful'}
    else:
        return {'status': 'failure', 'message': 'Invalid username or password'}, 401

if __name__ == '__main__':
    init_db()
    app.run(debug=True)