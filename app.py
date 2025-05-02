
import socket
import threading
from flask import Flask, request, render_template, session, redirect, jsonify, make_response, url_for
from functools import wraps
from flask_socketio import SocketIO
from user.routes import user_bp  
from database import db
from googleapiclient.discovery import build
from google.oauth2 import service_account
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from authlib.integrations.flask_client import OAuth
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import io
import json
from datetime import datetime
from flask_socketio import SocketIO, emit
import queue
import json
import requests
import time

app = Flask(__name__)
app.secret_key = "7a396704-83f5-4598-8a7c-32e4bd58c676"
app.config['SESSION_PERMANENT'] = False  # Ensure session expires on browser close
app.register_blueprint(user_bp, url_prefix='/api')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

SERVER_IP = "raspberrypi"  # Change this to match your setup
PORT = 10000
appConf = {
    "OAUTH2_CLIENT_ID": os.environ.get("OAUTH2_CLIENT_ID"),
    "OAUTH2_CLIENT_SECRET": os.environ.get("OAUTH2_CLIENT_SECRET"),
    "OAUTH2_META_URL": "https://accounts.google.com/.well-known/openid-configuration",
    "FLASK_SECRET": os.environ.get("FLASK_SECRET"),
    "FLASK_PORT": 5000
}

oauth = OAuth(app)
# list of google scopes - https://developers.google.com/identity/protocols/oauth2/scopes
google = oauth.register(
    "google",
    client_id=appConf.get("OAUTH2_CLIENT_ID"),
    client_secret=appConf.get("OAUTH2_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email"
    },
    server_metadata_url=f'{appConf.get("OAUTH2_META_URL")}',
)


winner_queue = queue.Queue()
player_start_queue = queue.Queue() 

# Google Drive API Setup
SCOPES = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.readonly"]
CLIENT_SECRETS_FILE = "client_secret.json"
ROOT_FOLDER_ID = "1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v"
ARCHIVE_FOLDER_ID = "1GM5-ZA57QPylEhcMexwhhVmdd2g09ZRX"
TOKEN_JSON_PATH = "token.json"  

REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:5000/callback")

flow = Flow.from_client_secrets_file(
    CLIENT_SECRETS_FILE,
    scopes=SCOPES,
    redirect_uri=REDIRECT_URI
)


# Authentication Middleware
def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        session.permanent = False  # Ensure session is non-permanent per request
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            return redirect('/')
    return wrap


def get_drive_service():
    """Authenticate using OAuth 2.0 and return the Google Drive service."""
    creds = None

    # Load credentials from token.json
    if os.path.exists(TOKEN_JSON_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_JSON_PATH, SCOPES)

    # If no valid credentials, start OAuth flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Refreshing expired credentials.")
            creds.refresh(Request())
        else:
            print("🌐 Starting OAuth flow for new authentication.")
            flow = Flow.from_client_secrets_file(
                CLIENT_SECRETS_FILE,
                scopes=SCOPES,
                redirect_uri='http://localhost:5000/callback'  # adjust if needed for deployment
            )
            auth_url, _ = flow.authorization_url(prompt='consent')
            print(f"🔎 Go to this URL and authorize access: {auth_url}")

            code = input("Enter the authorization code: ").strip()
            flow.fetch_token(code=code)
            creds = flow.credentials

            # Save credentials for future use
            with open(TOKEN_JSON_PATH, 'w') as token_file:
                token_file.write(creds.to_json())
            print("✅ Credentials saved to token.json")

    try:
        from googleapiclient.discovery import build
        service = build('drive', 'v3', credentials=creds)
        print("✅ Google Drive service initialized successfully.")
        return service
    except Exception as e:
        print(f"❌ Error initializing Google Drive service: {e}")
        return None
    



def create_drive_folder(folder_name, parent_folder_id):
    """Creates a new folder in Google Drive inside the specified parent folder."""
    try:
        service = get_drive_service()
        file_metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent_folder_id]
        }
        folder = service.files().create(body=file_metadata, fields="id").execute()
        return folder.get("id")
    except Exception as e:
        print(f"❌ Error creating folder: {e}")
        return None


def move_drive_folder(folder_id, new_parent_id):
    """Moves an entire folder (including its contents) to a new parent folder in Google Drive."""
    try:
        service = get_drive_service()
        file_info = service.files().get(fileId=folder_id, fields="parents").execute()
        old_parents = ",".join(file_info.get("parents", []))

        service.files().update(
            fileId=folder_id,
            addParents=new_parent_id,
            removeParents=old_parents,
            fields="id, parents"
        ).execute()

        print(f"✅ Successfully moved folder {folder_id} to {new_parent_id}")

    except Exception as e:
        print(f"❌ Error moving folder {folder_id}: {e}")


def generate_pdf(players, status_data):
    """Generate a well-formatted PDF report of all players and their status with tables."""
    buffer = io.BytesIO()
    today_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Create PDF Document
    pdf = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []

    styles = getSampleStyleSheet()
    title = Paragraph(f"<b>Player Archive Report</b><br/><br/>Date: {today_date}", styles["Title"])
    elements.append(title)

    # --- Player Table ---
    elements.append(Paragraph("<b>Player Information</b><br/><br/>", styles["Heading2"]))

    player_table_data = [["First Name", "Middle Name", "Last Name", "Category", "Age", "Belt", "Gym", "Weight (kg)"]]
    for player in players:
        player_table_data.append([
            player["firstname"],
            player.get("middlename", "-"),
            player["lastname"],
            player["category"],
            player["age"],
            player["belt"],
            player["gym"],
            player["weight"]
        ])

    player_table = Table(player_table_data, colWidths=[80, 80, 80, 80, 50, 60, 100, 70])
    player_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(player_table)
    elements.append(Paragraph("<br/><br/>", styles["Normal"]))

    # --- Status Table ---
    elements.append(Paragraph("<b>Player Status Records</b><br/><br/>", styles["Heading2"]))

    status_table_data = [["Name", "Total Score", "Status", "Timestamp"]]
    for s in status_data:
        status_table_data.append([
            s.get("name", "-"),
            s.get("totalScore", "-"),
            s.get("status", "-"),
            s.get("timestamp", "-")
        ])

    status_table = Table(status_table_data, colWidths=[150, 100, 100, 150])
    status_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(status_table)

    # Build the PDF
    pdf.build(elements)
    buffer.seek(0)
    return buffer


def upload_to_drive(file_stream, filename, parent_folder_id):
    service = get_drive_service()
    """Upload the PDF file to Google Drive."""
    from googleapiclient.http import MediaIoBaseUpload

    file_metadata = {
        "name": filename,
        "parents": [parent_folder_id]
    }
    media = MediaIoBaseUpload(file_stream, mimetype="application/pdf")

    uploaded_file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id, webViewLink"
    ).execute()

    return uploaded_file.get("id"), uploaded_file.get("webViewLink")

@app.route("/api/winners/save", methods=["POST"])
@login_required
def save_game():
    try:
        data = request.json
        game_number = data.get("game")
        players = data.get("players", [])

        # Save both players to the database
        for player in players:
            player["timestamp"] = datetime.now()
            db.status.insert_one(player)

        return jsonify({"message": "Game results saved successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/archiveRecords", methods=["POST"])
@login_required
def archive_records():
    """Archive player records, generate a PDF, and move data to Google Drive."""
    from datetime import datetime
    today_date = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    records_folder_name = f"Records_{today_date}"

    try:
        service = get_drive_service()
        # Step 1: Create archive folder in Google Drive
        records_archive_folder_id = create_drive_folder(records_folder_name, ARCHIVE_FOLDER_ID)

        # Step 2: Fetch all player records from the database
        players = list(db.players.find({}, {'_id': 0}))
        status_data = list(db.status.find({}, {'_id': 0}))
        if not players:
            return jsonify({"message": "No player records found to archive."}), 400

        # Step 3: Generate PDF from player data
        pdf_buffer = generate_pdf(players, status_data)

        # Step 4: Upload PDF to the archive folder
        pdf_filename = f"Players_Archive_{today_date}.pdf"
        pdf_id, pdf_link = upload_to_drive(pdf_buffer, pdf_filename, records_archive_folder_id)

        # Step 5: Move all player folders inside the new archive folder
        query = f"'{ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        folders = results.get("files", [])

        for folder in folders:
            folder_id = folder["id"]
            move_drive_folder(folder_id, records_archive_folder_id)

        # Step 6: Clear player records from the database
        db.players.delete_many({})
        db.status.delete_many({})

        return jsonify({
            "message": f"All player records moved to {records_folder_name}!",
            "pdf_link": pdf_link
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Track current registered RFIDs (this resets after every match)
current_rfids = {}  # e.g., {1: "56F989", 2: "AABBCC"}


@app.route("/get_player/<rfid>", methods=["GET"])
@login_required
def get_player(rfid):
    player = db.players.find_one({"rfid": rfid}, {"_id": 0})  # Exclude MongoDB's `_id`
    
    if player:
        return jsonify(player)
    return jsonify(None)

@socketio.on("game_state")
@login_required
def update_game_state(data):
    print("Game state updated:", data)  # ✅ Debugging print
    emit("game_state", data, broadcast=True)  # ✅ Broadcast to all clients

@socketio.on("start_game")
@login_required
def handle_start_game(data):
    print("Broadcasting start_game event:", data)  # Debugging
    emit("start_game", data, broadcast=True)
    
@socketio.on("update_score")
@login_required
def handle_update_score(data):
    print("Received updated score:", data)  # Debugging
    emit("update_score", data, broadcast=True)

# Global state to track connection status
is_connected = False
client_socket = None  # Global socket variable
def rfid_and_winner_handler():
    global is_connected, client_socket

    while True:
        if not is_connected:
            print("[INFO] Waiting for connection to be established...")
            time.sleep(1)
            continue

        try:
            print("[INFO] Attempting to connect to Raspberry Pi...")
            client_socket = socket.create_connection((SERVER_IP, PORT))
            print(f"[CONNECTED] Unified Connection to {SERVER_IP}:{PORT}")
            socketio.emit('connection_status', {'status': 'connected'})

            # Start RFID receive thread
            rfid_thread = threading.Thread(target=receive_rfid_data, args=(client_socket,), daemon=True)
            rfid_thread.start()

            while is_connected:
                time.sleep(0.1)

        except (socket.error, ConnectionRefusedError) as e:
            print(f"[ERROR] Connection lost: {e}")
            socketio.emit('connection_status', {'status': 'disconnected'})
            is_connected = False
            time.sleep(5)
    



@socketio.on('start_connection')
@login_required
def start_connection():
    global is_connected
    print("Attempting to connect to Raspberry Pi...")

    try:
        # Simulate connection logic
        time.sleep(2)  # Simulate connection time
        print("Connected to Raspberry Pi")
        
        # Emit connected status
        socketio.emit('connection_status', {'status': 'connected'})
        is_connected = True  # Update connection state
    except Exception as e:
        print(f"Connection failed: {e}")
        socketio.emit('connection_status', {'status': 'disconnected'})
        is_connected = False  # Update connection state

@socketio.on('disconnect_request')
@login_required
def handle_disconnect_request():
    global is_connected
    print("[INFO] Disconnect requested (page refresh/close).")
    is_connected = False
    socketio.emit('connection_status', {'status': 'disconnected'})


def receive_rfid_data(client_socket):
    """Receiver thread to handle incoming RFID or server messages."""
    global is_connected
    while True:
        try:
            data = client_socket.recv(1024)
            if not data:
                print("[DISCONNECTED] Server closed connection.")
                socketio.emit('connection_status', {'status': 'disconnected'})
                is_connected = False
                break
            decoded_data = data.decode('utf-8').strip()
            print(f"[INCOMING] {decoded_data}")

            # 🔥 Emit to the web clients
            socketio.emit("rfid_data", {"rfid": decoded_data})

        except Exception as e:
            print(f"[RECEIVE ERROR] {e}")
            break




### --- 🔥 SOCKET EVENT HANDLING --- ###
@socketio.on("winner_displayed", namespace="/")
@login_required
def handle_winner_display(data):
    print(f"[SOCKET EVENT] Winner announced: {data}")

    # Broadcast to all connected clients
    emit("winner_displayed", data, broadcast=True)

    # Queue the winner data to be sent
    winner = data.get("winner")
    winner_data = data.get("winnerData", {})
    send_winner_data(winner, winner_data)


def send_winner_data(winner, winner_data=None):
    if client_socket:
        try:
            data = {"winner": winner}
            if winner_data:
                data["winnerData"] = winner_data

            json_data = json.dumps(data)
            client_socket.sendall(json_data.encode("utf-8"))
         
        except Exception as e:
            print(f"[SEND ERROR] Failed to send winner data: {e}")






"""=======================Recording========================"""
@socketio.on("player_started", namespace="/")
@login_required
def handle_player_started(data):
    """Handle when a player starts the game."""
    print(f"[SOCKET EVENT] Player {data.get('player')} started: {data}")

    # Broadcast to all connected clients
    emit("player_started", data, broadcast=True)

    # Queue the player start data to be sent
    player = data.get("player")
    player_data = data.get("playerData", {})
    send_player_start_data(player, player_data)


def send_player_start_data(player, player_data=None):
    if client_socket:
        try:
            data = {"player": player}
            if player_data:
                data["playerData"] = player_data

            json_data = json.dumps(data)
            client_socket.sendall(json_data.encode("utf-8"))
           


        except Exception as e:
            print(f"[SEND ERROR] Failed to send player start data: {e}")



"""=======================Recording========================"""

# GET all status entries
@app.route('/api/overview')
@login_required
def get_status():
    """Fetch all status data (overview)."""
    try:
        status_data = list(db.status.find({}, {'_id': 0}))
        return jsonify(status_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE all status entries
@app.route("/api/overview/clear", methods=["DELETE"])
@login_required
def clear_status():
    """Remove all status entries (after archiving or resetting)."""
    try:
        db.status.delete_many({})
        return jsonify({"message": "All status entries have been removed."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/players/clear", methods=["DELETE"])
@login_required
def clear_players():
    """Remove all players after archiving."""
    try:
        db.players.delete_many({})
        return jsonify({"message": "All players have been removed after archiving."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_files(folder_id=ROOT_FOLDER_ID):
    """Fetch files from Google Drive folder."""
    
    try:
        service = get_drive_service()
        query = f"'{folder_id}' in parents and trashed = false"
        results = service.files().list(q=query, fields="files(id, name, mimeType, webViewLink)").execute()
        files = results.get("files", [])

        if not files:
            print(f" No files found in folder: {folder_id}")  # Debugging
        else:
            print(f" Found {len(files)} files in folder: {folder_id}")  # Debugging

        return files
    except Exception as e:
        print(f"❌ Error retrieving files: {e}")  # Debugging
        return []



# Routes
@app.route('/')
def home():
    if session.get('logged_in'):
        return redirect('/api/admin')  # Redirect to admin if logged in
    return render_template('home.html')

@app.route('/login')
def log():
    if session.get('logged_in'):
        return redirect('/api/admin')  # Redirect if logged in
    return render_template('log.html')


@app.route('/registration')
def reg():
    return render_template('reg.html')

@app.route('/api/admin')
@login_required
def admin():
    files = get_files()
    response = make_response(render_template('admin.html', files=files))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response



@app.route('/api/dashboard_data')
def dashboard_data():
    """Returns player count for the dashboard."""
    try:
        players_count = db.players.count_documents({})
        return jsonify({'players': players_count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/audienceSB')
def audienceSB():
    return render_template('audienceSB.html')

@app.route('/api/adminSB')
def adminSB():
    return render_template('adminSB.html')


@app.route('/api/players')
def get_players():
    """Fetch all registered players."""
    try:
        players = list(db.players.find({}, {'_id': 0}))
        return jsonify(players)
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@app.route("/folder/<folder_id>")
def folder_contents(folder_id):
    """Fetch files from a Google Drive folder."""
    try:
        files = get_files(folder_id)
        if not files:
            return jsonify({"message": "No files found", "files": []}), 200
        return jsonify(files)
    except Exception as e:
        print(f"❌ Error fetching files: {e}")  # Debugging output
        return jsonify({"error": str(e)}), 500

#google login

@app.route("/login/google")
def googleLogin():
    try:
        redirect_uri = url_for('authorize_google', _external=True)
        return google.authorize_redirect(redirect_uri)
    except Exception as e:
        app.logger.error(f"Error During Login: {str(e)}")
        return "Error occurred during login", 500


ALLOWED_EMAILS = {'candovince94@gmail.com', 'example2@gmail.com'}

@app.route("/authorize/google")
def authorize_google():
    try:
        token = google.authorize_access_token()
        userinfo_endpoint = google.server_metadata['userinfo_endpoint']
        resp = google.get(userinfo_endpoint)
        user_info = resp.json()
        username = user_info['email']

        if not db.authorized.find_one({'email': username}):
            return "Access Denied. Your email is not authorized.", 403

        session['username'] = username
        session['oauth_token'] = token
        session['logged_in'] = True
        return redirect(url_for('admin'))
    except Exception as e:
        app.logger.error(f"Error in Authorization: {str(e)}")
        return "Authorization failed.", 500


@app.route('/add/registration')
def registration():
    return render_template('practice.html')

@app.route('/add/email', methods=['POST'])
def add_email():
    email = request.form['email']
    if db.authorized.find_one({'email': email}):
        return "Email already exists. Please use another."
    db.authorized.insert_one({'email': email})
    return "Email submitted successfully!"


@app.route("/login/dev")
def googleDev():
    try:
        redirect_uri = url_for('authorize_dev', _external=True)
        return google.authorize_redirect(redirect_uri)
    except Exception as e:
        app.logger.error(f"Error During Dev Login: {str(e)}")
        return "Error occurred during login", 500


# Separate allowed emails for dev
ALLOWED_DEV_EMAILS = {'candovince0908@gmail.com', 'example2@gmail.com'}

@app.route("/authorize/dev")
def authorize_dev():
    try:
        token = google.authorize_access_token()
        userinfo_endpoint = google.server_metadata['userinfo_endpoint']
        resp = google.get(userinfo_endpoint)
        user_info = resp.json()
        username = user_info['email']

        if not db.emails.find_one({'email': username}):
            return "Access Denied. Your email is not authorized.", 403

        session['username'] = username
        session['oauth_token'] = token
        return redirect(url_for('registration'))
    except Exception as e:
        app.logger.error(f"Error in Dev Authorization: {str(e)}")
        return "Authorization failed.", 500

@app.route('/callback')
def callback():
    try:
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials
        session['credentials'] = credentials_to_dict(credentials)

        return redirect(url_for('index'))  # or wherever you want to redirect
    except Exception as e:
        print(f"❌ Error during callback: {e}")
        return "Authorization failed.", 500

def credentials_to_dict(credentials):
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }


if __name__ == '__main__':
    socketio.start_background_task(target=rfid_and_winner_handler)
    socketio.run(app, host="0.0.0.0", port=5000) 