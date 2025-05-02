def receive_rfid_data(client_socket):
    """Receiver thread to handle incoming RFID or server messages."""
    while True:
        try:
            data = client_socket.recv(1024)
            if not data:
                print("[DISCONNECTED] Server closed connection.")
                break
            decoded_data = data.decode('utf-8').strip()
            print(f"[INCOMING] {decoded_data}")

            # 🔥 Emit to the web clients
            socketio.emit("rfid_data", {"rfid": decoded_data})

        except Exception as e:
            print(f"[RECEIVE ERROR] {e}")
            break