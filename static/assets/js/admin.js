document.addEventListener("DOMContentLoaded", function () {
  const socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );

  // Listen for RFID data
  socket.on("rfid_data", function (data) {
    console.log("Received RFID:", data.rfid);

    // Insert RFID into input field
    document.getElementById("rfid").value = data.rfid;
  });
});
document.addEventListener("DOMContentLoaded", function () {
  // Initialize socket connection
  const socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );

  const connectButton = document.getElementById("connect-button");
  const buttonText = connectButton.querySelector("h1");

  // Check connection status from localStorage
  const storedStatus = localStorage.getItem("connectionStatus");
  if (storedStatus === "connected") {
    buttonText.innerText = "Connected"; // Set to 'Connected' if stored
  } else {
    buttonText.innerText = "Disconnected"; // Otherwise, 'Disconnected'
  }

  // Emit a 'start_connection' event when the button is clicked
  connectButton.addEventListener("click", function () {
    console.log("Connect button clicked");
    socket.emit("start_connection"); // Emit to start the connection
  });

  // Listen for the connection status from the server
  socket.on("connection_status", function (data) {
    if (data.status === "connected") {
      buttonText.innerText = "Connected"; // Change text to "Connected"
      localStorage.setItem("connectionStatus", "connected"); // Store status in localStorage
    } else {
      buttonText.innerText = "Disconnected"; // Change text to "Disconnected"
      localStorage.setItem("connectionStatus", "disconnected"); // Store status in localStorage
    }
  });

  // Handle log out functionality
  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", function () {
    console.log("Logging out and disconnecting...");

    // Emit a disconnect event
    socket.emit("disconnect_request");

    // Clear localStorage status
    localStorage.removeItem("connectionStatus");

    // Redirect to logout route
    window.location.href = "/api/logout"; // This redirects to the logout route, make sure it's handled in the backend
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Sidebar Navigation Elements
  const navItems = document.querySelectorAll(".container-nav-circle");

  // Page Content Sections
  const contentSections = {
    dashboard: document.getElementById("dashboard-content"),
    history: document.getElementById("history-content"),
    record: document.getElementById("record-content"),
    news: document.getElementById("news-content"),
    poomsae: document.getElementById("poomsae-content"),
  };

  // Function to Hide All Sections
  function hideAllSections() {
    Object.values(contentSections).forEach((section) => {
      section.style.display = "none";
    });
  }

  // Function to Remove Active Class from Sidebar Buttons
  function removeActiveClass() {
    navItems.forEach((item) => item.classList.remove("active"));
  }

  // Set Default View to Dashboard
  hideAllSections();
  contentSections.dashboard.style.display = "block";
  document.querySelector(".dashboard").classList.add("active");

  // Attach Click Event to Sidebar Items (except "Connect" button)
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Prevent content switch for "Connect" button
      if (this.classList.contains("connect")) return;

      hideAllSections();
      removeActiveClass();
      let sectionClass = this.classList[0];
      if (contentSections[sectionClass]) {
        contentSections[sectionClass].style.display = "block";
      }
      this.classList.add("active");
    });
  });

  // Dynamic Poomsae Image Loading
  const formList = [
    {
      id: "iljang",
      label: "Taeguk 1 Jang",
      steps: [
        "Start in the Ready or “Joon Bi” stance",
        "Turn left 90 degrees into a walking stance with left foot forward, left low block",
        "Step forward into walking stance with right foot forward, right hand middle punch",
        "Turn right 180 degrees into a walking stance with right foot forward, right low block",
        "Step forward into walking stance with left foot forward, left hand middle punch",
        "Turn left 90 degrees into a front stance with left foot forward, left low block",
        "Right middle punch",
        "Turn right 90 degrees into a walking stance with right foot forward, left inside block",
        "Step forward into walking stance with left foot forward, right hand middle punch",
        "Turn left 180 degrees into a walking stance with left foot forward, right inside block",
        "Step forward into walking stance with right foot forward, left hand middle punch",
        "Turn right 90 degrees into a front stance with right foot forward, right low block",
        "Left middle punch",
        "Turn left 90 degrees into a walking stance with left foot forward, left high block",
        "Right front kick, foot placed down into walking stance with right foot forward",
        "Right middle punch",
        "Turn right 180 degrees into a walking stance with right foot forward, right high block",
        "Left front kick, foot placed down into walking stance with left foot forward",
        "Left middle punch",
        "Turn right 90 degrees into a front stance with left foot forward, left low block",
        "Step forward into a front stance with right foot forward, right middle punch, Yell Kihap!",
        "When the Master says “Bah Ro”, turn and face the Master.",
      ],
    },
    {
      id: "eejang",
      label: "Taeguk 2 Jang",
      steps: [
        "Start in the Ready or “Joon Bi” stance",
        "Turn 90 degrees to the left into a walking stance with left foot forward, left arm low block",
        "Step forward into front stance with right foot forward, right arm middle punch",
        "Turn 180 degrees to the right into walking stance with right foot forward, right arm low block",
        "Step forward into front stance with left foot forward, left arm middle punch",
        "Turn 90 degrees to the left into walking stance with left foot forward, right arm middle block",
        "Step forward into walking stance with right foot forward, left arm middle block",
        "Turn 90 degrees to the left into walking stance with left foot forward, left arm low block",
        "Right foot front snap kick",
        "Front stance with right foot forward, right arm high punch",
        "Turn 180 degrees to the right into walking stance with right foot forward, right arm low block",
        "Left foot front snap kick",
        "Front stance with left foot forward, left arm high punch",
        "Turn 90 degrees to the left into walking stance with left foot forward, left arm rising block",
        "Step forward into walking stance with right foot forward, right arm rising block",
        "Turn 270 degrees to the left into walking stance with left foot forward, right arm middle block",
        "Turn 180 degrees to the right into walking stance with right foot forward, left arm middle block",
        "Turn 90 degrees to the left into walking stance with left foot forward, left arm low block",
        "Right foot front snap kick",
        "Walking stance with right foot forward, right arm middle punch",
        "Left foot front snap kick",
        "Walking stance with left foot forward, left arm middle punch",
        "Right foot front snap kick",
        "Walking stance with right foot forward, right arm middle punch, yell “Kihap”",
        "When the Master says “Bah Ro”, turn and face the Master.",
      ],
    },
    {
      id: "samjang",
      label: "Taeguk 3 Jang",
      steps: [
        "Start in the Ready or “Joon Bi” stance",
        "Turn left 90 degrees, left low block",
        "Right front kick",
        "Right punch",
        "Left punch",
        "Turn right 180 degrees, right low block",
        "Left front kick",
        "Left punch",
        "Right punch",
        "Turn left 90 degrees, left foot into walking stance, right knife hand strike to the neck",
        "Step forward into right walking stance, left knife hand strike to the neck",
        "Turn left 90 degrees, left knife hand middle block in back stance",
        "Grab in back stance",
        "Right punch in front stance",
        "Turn right 180 degrees, right knife hand middle block in back stance",
        "Grab in back stance",
        "Left punch in front stance",
        "Turn left 90 degrees, right inside block",
        "Step forward into right walking stance, left inside block",
        "Turn left 270 degrees, left low block",
        "Right front kick",
        "Right punch",
        "Left punch",
        "Turn right 180 degrees, right low block",
        "Left front kick landing in a left front stance",
        "Left punch",
        "Right punch",
        "Turn left 90 degrees into left walking stance, left low block",
        "Right punch",
        "Step forward into right walking stance, right low block",
        "Left punch",
        "Left front kick landing in a left walking stance",
        "Left low block",
        "Right punch",
        "Right front kick landing in a right walking stance",
        "Right low block",
        "Left punch, Yell “Kihap!",
        "When the Master says “Bah Ro”, turn and face the Master.",
      ],
    },
    {
      id: "sajang",
      label: "Taeguk 4 Jang",
      steps: [
        "Start in the Ready or “Joon Bi” stance",
        "Turn left 90 degrees, left double knife hand middle block in back stance",
        "Transition*",
        "Step forward, right fingertip thrust in front stance",
        "Turn right 180 degrees, right double knife hand middle block in back stance",
        "Transition*",
        "Step forward, left fingertip thrust in front stance",
        "Turn left 90 degrees, left knife hand high block and right knife hand strike (both at same time) in front stance",
        "Right front kick",
        "Left middle punch in front stance",
        "Left side kick",
        "Right side kick",
        "Right double knife hand middle block in back stance",
        "Turn left 270 degrees, left outside block in back stance",
        "Right front kick (don’t move forward)",
        "Right inside block in back stance",
        "Turn right 180 degrees, right outside block in back stance",
        "Left front kick (don’t move forward)",
        "Left inside block in back stance",
        "Turn left 90 degrees, left knife hand high block and right knife hand strike (both at same time) in front stance",
        "Right front kick",
        "Right back fist strike (to opponent’s nose) in front stance",
        "Turn left 90 degrees, left inside block followed by",
        "Right middle punch in walking stance",
        "Turn right 180 degrees, right inside block followed by",
        "Left middle punch in walking stance",
        "Turn left 90 degrees, left inside block",
        "Right middle punch",
        "Left middle punch in front stance",
        "Step forward, right inside block",
        "Left middle punch",
        "Right middle punch in front stance, Yell Kihap!",
        "When the Master says “Bah Ro”, turn and face the Master.",
      ],
    },
    {
      id: "ohjang",
      label: "Taeguk 5 Jang",
      steps: [
        "Start in the Ready or “Joon Bi” stance",
        "Turn left into front stance, left low block",
        "Left foot comes back next to the right foot, left hand hammer fist downwards",
        "Turn right into right front stance, right hand low block",
        "Right foot comes back next to the left foot, right hand hammer fist downwards",
        "Advance forward into left front stance, left inside block",
        "Right inside block",
        "Right foot front kick into right front stance",
        "Right hand backfist",
        "Left inside block",
        "Left foot front kick into left front stance",
        "Left hand backfist",
        "Right inside block",
        "Advance right foot forward into right front stance, right hand backfist",
        "Moving left foot, turn 270 degrees to the left into left back stance, knife hand middle block with left hand",
        "Step into right front stance, right elbow strike",
        "Moving right foot, turn 180 degrees all the way to the right into right back stance, knife hand middle block",
        "Step into left front stance, left elbow strike",
        "Turn left 90 degrees into left front stance, left hand low block",
        "Right inside block",
        "Right foot kick into right front stance",
        "Right hand low block",
        "Left inside block",
        "Turn left 90 degrees into left front stance, left high block",
        "Right side kick and right hand punch together into right front stance",
        "Left elbow into open right hand",
        "Turn right 180 degrees into right front stance, right high block",
        "Left side kick and left hand punch together into left front stance",
        "Right elbow strike into open left hand",
        "Turn left 90 degrees into left front stance, left low block",
        "Right inside block",
        "Right front kick, hop forward and land in a twist stance ",
        "While executing a right backfist to the nose. The right foot is flat and the left foot should be on the ball of foot, yell “Kihap”!",
        "When the Master says “Bah Ro”, turn and face the Master.",
      ],
    },
    {
      id: "yukjang",
      label: "Taeguk 6 Jang",
      steps: [
        "Start in the Ready or “Joon Bi” stance",
        "Turn left 90 degrees into left front stance, left low block",
        "Right leg front kick, step back into left back stance and",
        "Do a left outside block at same time",
        "Turn right 180 degrees into right front stance, right low block",
        "Left front kick, step back into right back stance and",
        "Do a right outside block at same time",
        "Turn left 90 degrees into a left front stance, right knife hand high block",
        "Right roundhouse kick and place kicking leg down just ahead of the left foot",
        "Turn left 90 degrees and step into a left front stance, left outside block",
        "Right middle punch",
        "Right front kick and land in a right front stance",
        "Left middle punch",
        "Turn right 180 degrees into right front stance, right outside block",
        "Left middle punch",
        "Left front kick landing in a left front stance",
        "Right middle punch",
        "Turn left 90 degrees into a Joon Bi/Ready stance, cross both hands over your head and do a slow double low block",
        "Step forward into a right front stance, left knife hand high block",
        "Left roundhouse kick and yell “Kihap”!",
        "Place kicking leg down next to right foot, turn right 270 degrees into a right front stance, right low block",
        "Left front kick",
        "Step back into right back stance, right outside block",
        "Turn left 180 degrees into left front stance, left low block",
        "Right front kick, step back into left back stance",
        "Left outside block",
        "Move your right foot, turn left 90 degrees into a left back stance, double knife hand middle block",
        "Stepping back into right back stance, double knife hand middle block",
        "Stepping back into left front stance, left middle palm block",
        "Right middle punch",
        "Stepping back into right front stance, right middle palm block",
        "Left middle punch",
        "When the Master says “Bah Ro”, move your right foot back (in line with your left foot) and go into a Ready/Joon Bi stance.",
      ],
    },
    {
      id: "chiljang",
      label: "Taeguk 7 Jang",
      steps: [
        "Start in the Ready or “Joon Bi” stance",
        "Turn left 90 degrees into left cat stance, right crossing palm block",
        "Right front kick",
        "Return to left cat stance, left inside block",
        "Turn right 180 degrees into right cat stance, left crossing palm block",
        "Left front kick",
        "Return to cat stance, Right inside block",
        "Turn left 90 degrees, move into left back stance, Left double knife hand low block",
        "Step forward into right back stance, Right double knife hand low block",
        "Turn left 90 degrees, move into left cat stance",
        "Right crossing palm block, reverse backfist to nose (with same right hand), left fist remains palm down under right elbow",
        "Left fist remains palm down under right elbow",
        "Turn right 180 degrees into right cat stance",
        "Left crossing palm block, reverse backfist to nose (with same left hand), right fist remains palm down under left elbow",
        "Right fist remains palm down under left elbow",
        "Turn left 90 degrees, place left foot next to right foot, bring both hands into a chamber position on your belt with palms up, left hand grabs right fist at stomach level, slowly extend your arms outwards to chest level (attention stance or standing meditation)",
        "Step forward with left foot into left front stance, double scissor block (left arm does an outside block and right hand does a low block at same time)",
        "Reverse scissor block (right outside block and left low block)",
        "Step forward with right foot into right front stance, double scissor block (right outside block, left low block)",
        "Reverse double scissor block (left outside block, right low block)",
        "Moving left foot, turn left 270 degrees into left front stance and do a double outside block (breaking your opponent’s grip on your neck or shoulders)",
        "In front stance, reach up and grab head of your imaginary opponent with both hands, bring hands down & bring right knee up (knee strike to opponent’s head), hop forward land with right foot with left foot crossed behind",
        "Throw a double uppercut (palm up) to opponent’s ribs, move left leg back and go into right front stance",
        "Double crossed low block",
        "Move right foot, turn right 180 degrees into right front stance, double outside block (breaking your opponent’s grip on your neck or shoulders)",
        "In front stance, reach up and grab head of your imaginary opponent with both hands, bring hands down & bring left knee up (knee strike to opponent’s head), hop forward land with left foot with right foot crossed behind",
        "Throw a double uppercut (palm up) to opponent’s ribs, move right leg back and go into left front stance",
        "Double crossed low block",
        "Turn left 90 degrees, move left foot into left walking stance, left backfist to temple (chamber backfist above right shoulder)",
        "Open left fist, right crescent kick slapping palm of left hand with the sole of your right foot, land in a right horse stance",
        "Right elbow strike into open palm of your left hand",
        "Move into right walking stance, right backfist to temple (chamber backfist above left shoulder)",
        "Open right fist, left crescent kick slapping palm of right hand with the sole of your left foot, land in a left horse stance",
        "Left elbow strike into open palm of your right hand",
        "Stay in horse stance",
        "Left single knife hand middle block",
        "Step forward into right horse stance, right side punch, “Kihap!”",
        "When the Master says “Bah Ro”, turn and face the Master.",
      ],
    },
    {
      id: "paljang",
      label: "Taeguk 8 Jang",
      steps: [
        "Start in the Ready or “Joon Bi” stance",
        "Step forward with left foot into left back stance, double fist middle block",
        "Slide left foot sideways into left front stance, reverse middle punch with right hand",
        "Left double front kick, yell Kihap!",
        "Left double front kick, yell Kihap!",
        "Left inside block",
        "Double punch Right (right hand first)",
        "Double punch Left (right hand first)",
        "Step forward into right front stance, right middle punch",
        "Turn left 270 degrees, left low block and right single mountain high block (at same time), reverse front stance, look towards direction of low block",
        "Move left foot into (forward) left front stance, grab imaginary opponent’s collar with left hand & pull towards your right shoulder, slow right uppercut to imaginary opponent’s chin",
        "Double step backwards, turn your head 180 degrees",
        "Right low block and left single mountain high block (at same time), reverse front stance, look towards direction of low block",
        "Move right foot into (forward) right front stance, grab imaginary opponent’s collar with right hand & pull towards your left shoulder, slow left uppercut to imaginary opponent’s chin",
        "Turn left 270 degrees, left double knife hand block in back stance",
        "Move left foot into left front stance, right middle punch",
        "Right front kick",
        "Return foot back to kicking position (behind left foot)",
        "Step back with left foot, bring right foot into tiger/cat stance, right palm block",
        "Turn left 90 degrees, left foot in tiger/cat stance, left double knife hand middle block",
        "Left front kick",
        "Right middle punch in front stance",
        "Move left foot back into tiger/cat stance, left palm block",
        "Turn right 180 degrees, right foot into tiger/cat stance, right double knife hand middle block",
        "Right front kick",
        "Left middle punch in front stance",
        "Move right foot back into tiger/cat stance, palm block",
        "Turn right 90 degrees, right double fist low block in back stance",
        "Left double front kick, yell “Kihap!”",
        "Left double front kick, yell “Kihap!”",
        "land in a right front stance, right inside block",
        "Double punch Left (left hand first)",
        "Double punch Right (left hand first)",
        "Turn left 270 degrees, left single knife hand middle block in back stance",
        "Move left foot into left front stance, Reverse elbow strike with right arm",
        "Reverse backfist to the nose with right fist",
        "Middle punch with left hand",
        "Move right foot and turn 180 degrees to the right into a right back stance, single knife hand middle block",
        "Move right foot into right front stance, reverse elbow strike with left arm",
        "Reverse backfist to the nose with left fist",
        "Middle punch with right hand",
        "When Master yells “Bah Ro”, move left foot, turn left 90 degrees and return to Ready/Joon Bi stance.",
      ],
    },
  ];

  const buttonsContainer = document.getElementById("poomsae-buttons");
  const displayContainer = document.getElementById("poomsae-display");

  formList.forEach((form) => {
    const btn = document.createElement("button");
    btn.textContent = form.label;
    btn.classList.add("form-btn");

    btn.addEventListener("click", () => {
      // Clear existing content
      displayContainer.innerHTML = "";

      // Create and add title
      const title = document.createElement("h3");
      title.textContent = `${form.label} - Step by Step`;
      displayContainer.appendChild(title);

      // Create and add steps-holder container
      const stepsHolder = document.createElement("div");
      stepsHolder.id = "steps-holder";
      stepsHolder.classList.add("steps-holder-container");
      displayContainer.appendChild(stepsHolder);

      // Determine number of steps
      const stepCount = form.steps ? form.steps.length : form.totalSteps;

      for (let i = 0; i < stepCount; i++) {
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("image-container");

        const img = document.createElement("img");
        img.src = `../static/assets/images/poomsae/${form.id}/${i + 1}.jpg`;
        img.alt = `Step ${i + 1}`;
        img.classList.add("step-image");

        const text = document.createElement("span");
        text.textContent = form.steps ? form.steps[i] : `Step ${i + 1}`;
        text.classList.add("hover-text");

        imgContainer.appendChild(img);
        imgContainer.appendChild(text);
        stepsHolder.appendChild(imgContainer); // Append image container to steps-holder
      }
    });

    buttonsContainer.appendChild(btn);
  });
});

//====================================================================================================

// REGISTER PLAYERS
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form[name='signup_form']");
  const submitButton = form ? form.querySelector(".btn-submit") : null;

  if (!form || !submitButton) {
    console.error(" Error: Registration form or submit button not found.");
    return;
  }

  //  Remove previous event listener before adding a new one
  submitButton.removeEventListener("click", handleFormSubmit);
  submitButton.addEventListener("click", handleFormSubmit);
});

async function handleFormSubmit(event) {
  event.preventDefault(); // Prevent default form submission

  // Prevent double-click issue by disabling the button temporarily
  const submitButton = event.target;
  submitButton.disabled = true;

  // Gather form data
  const formData = new FormData(
    document.querySelector("form[name='signup_form']")
  );
  let data = {};
  formData.forEach((value, key) => {
    data[key] = value.trim();
  });

  console.log("📨 Sending Registration Data:", data); // Debugging output

  // Ensure required fields are filled
  const requiredFields = [
    "rfid",
    "firstname",
    "lastname",
    "category",
    "age",
    "belt",
    "gym",
    "weight",
    "weight_category",
  ];
  const missingFields = requiredFields.filter(
    (field) => !data[field] || data[field] === "select"
  );

  if (missingFields.length > 0) {
    alert(" Please fill in all required fields: " + missingFields.join(", "));
    submitButton.disabled = false; // Re-enable button
    return;
  }

  try {
    const response = await fetch("/api/players/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("🔍 Full Server Response:", result); // Debugging

    if (response.status === 400) {
      console.warn("⚠️ Bad Request Error:", result.error);
      alert("❌ Error: " + result.error);
      submitButton.disabled = false;
      return;
    }

    if (result.message) {
      alert("🎉 Player registered successfully!");
      document.querySelector("form[name='signup_form']").reset();
      fetchPlayers(); // Refresh list
    } else {
      alert("❌ Error: " + (result.error || "Unknown error"));
    }
  } catch (error) {
    console.error("🚨 Fetch error:", error);
    alert("❌ An error occurred: " + error.message);
  } finally {
    submitButton.disabled = false;
  }
}

//====================================================================================================

//FETCH PLAYERS
document.addEventListener("DOMContentLoaded", function () {
  async function fetchPlayers() {
    const tableBody = document.querySelector("#players-table tbody");
    if (!tableBody) {
      console.error("Error: #players-table tbody not found.");
      return;
    }

    try {
      const response = await fetch("/api/players");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const players = await response.json();
      tableBody.innerHTML = "";

      players.forEach((player) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${player.rfid}</td>
          <td>${player.firstname}</td>
          <td>${player.lastname}</td>
          <td>${player.category}</td>
          <td>${player.age}</td>
          <td>${player.belt}</td>
          <td>${player.gym}</td>
          <td>${player.weight}</td>
        `;
        tableBody.appendChild(row);
      });

      console.log("Players list updated successfully.");
    } catch (error) {
      console.error("Error fetching players:", error);
      tableBody.innerHTML = `<tr><td colspan="8">Failed to load data</td></tr>`;
    }
  }

  async function fetchOverview() {
    const overviewTableBody = document.querySelector("#overview-table tbody");
    if (!overviewTableBody) {
      console.error("Error: #overview-table tbody not found.");
      return;
    }

    try {
      const response = await fetch("/api/overview");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const overviewData = await response.json();

      overviewTableBody.innerHTML = ""; // Clear old rows

      overviewData.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.gym}</td>
          <td>${item.totalScore}</td>
          <td>${item.performing}</td>
          <td>${item.category}</td>
          <td>${item.status}</td>
          <td>${item.timestamp}</td>
        `;
        overviewTableBody.appendChild(row);
      });

      console.log("Overview data loaded successfully.");
    } catch (error) {
      console.error("Error fetching overview data:", error);
    }
  }

  window.fetchPlayers = fetchPlayers;
  fetchPlayers();
  fetchOverview();
});

//====================================================================================================

//FETCH FILES

// Define fetchFiles globally
async function fetchFiles() {
  const recordBox = document.querySelector(".record-box");
  const backButton = document.getElementById("back-button");

  if (!recordBox) {
    console.error("Error: .record-box not found.");
    return;
  }

  try {
    console.log("📨 Fetching files...");
    const response = await fetch("/folder/1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Server Response:", data); // Debugging output

    if (!Array.isArray(data)) {
      throw new Error("API response is not an array!");
    }

    recordBox.innerHTML = ""; // Clear previous records

    if (data.length === 0) {
      recordBox.innerHTML = "<p>No files found.</p>";
      return;
    }

    // Hide the back button when showing all folders
    if (backButton) {
      backButton.style.display = "none";
    }

    data.forEach((file) => {
      const div = document.createElement("div");

      if (file.mimeType === "application/vnd.google-apps.folder") {
        div.innerHTML = `
          <i class="fa-solid fa-folder folder-icon" onclick="toggleFolder('${file.id}')"></i>
          <span class="folder" onclick="toggleFolder('${file.id}')">${file.name}</span>
        `;
      } else {
        div.innerHTML = `
          <i class="fa-solid fa-file file-icon"></i>
          <a href="${file.webViewLink}" target="_blank" class="file">${file.name}</a>
        `;
      }
      recordBox.appendChild(div);
    });

    console.log("Record files updated successfully.");
  } catch (error) {
    console.error("Error fetching files:", error);
    recordBox.innerHTML = "<p>Failed to load files.</p>";
  }
}

// Add a "Back" button to return to the main folder view
document.addEventListener("DOMContentLoaded", function () {
  const recordBox = document.querySelector(".record-box");

  // Create the back button
  const backButton = document.createElement("button");
  backButton.id = "back-button";
  backButton.textContent = "Back to All Folders";
  backButton.style.display = "none"; // Initially hidden
  backButton.style.margin = "10px 0";
  backButton.style.padding = "10px";
  backButton.style.backgroundColor = "#d79447";
  backButton.style.color = "#fff";
  backButton.style.border = "none";
  backButton.style.borderRadius = "5px";
  backButton.style.cursor = "pointer";

  // Add click event to the back button
  backButton.addEventListener("click", function () {
    currentFolderId = null; // Reset the current folder ID
    fetchFiles(); // Reload all folders and files
    backButton.style.display = "none"; // Hide the back button
  });

  // Append the back button to the record box's parent container
  recordBox.parentElement.insertBefore(backButton, recordBox);

  // Automatically fetch records when the page loads
  fetchFiles();
});

// Fix the toggleFolder function
function toggleFolder(folderId) {
  const recordBox = document.querySelector(".record-box");
  const backButton = document.getElementById("back-button");

  if (currentFolderId === folderId) {
    // If the same folder is clicked again, reset to show all folders
    currentFolderId = null;
    fetchFiles(); // Reload all folders and files
    return;
  }

  currentFolderId = folderId; // Set the current folder ID

  // Fetch and display the contents of the clicked folder
  fetch(`/folder/${folderId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      recordBox.innerHTML = ""; // Clear the record box

      if (data.length === 0) {
        recordBox.innerHTML = "<p>No files found in this folder.</p>";
        return;
      }

      data.forEach((file) => {
        const div = document.createElement("div");

        if (file.mimeType === "application/vnd.google-apps.folder") {
          div.innerHTML = `
            <i class="fa-solid fa-folder folder-icon" onclick="toggleFolder('${file.id}')"></i>
            <span class="folder" onclick="toggleFolder('${file.id}')">${file.name}</span>
          `;
        } else {
          div.innerHTML = `
            <i class="fa-solid fa-file file-icon"></i>
            <a href="${file.webViewLink}" target="_blank" class="file">${file.name}</a>
          `;
        }
        recordBox.appendChild(div);
      });

      // Show the back button when inside a folder
      if (backButton) {
        backButton.style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Error fetching folder contents:", error);
      recordBox.innerHTML = "<p>Failed to load folder contents.</p>";
    });
}

let currentFolderId = null; // Track the currently opened folder

//====================================================================================================
//REFRESH FILES
document.addEventListener("DOMContentLoaded", function () {
  async function fetchDashboardData() {
    try {
      const response = await fetch("/api/dashboard_data");
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const playerCount = document.getElementById("number-players");
      if (playerCount) playerCount.textContent = data.players;
    } catch (error) {
      console.error(" Error fetching dashboard data:", error);
    }
  }

  fetchDashboardData();
});
//====================================================================================================

//BUTTON
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".open-window").forEach((button) => {
    button.addEventListener("click", function () {
      const url = this.getAttribute("data-url");
      if (url) {
        window.open(url, "_blank"); //  Open in a new tab
      } else {
        console.error(" Error: No URL found for this button.");
      }
    });
  });
});
//====================================================================================================
//ARCHIVE RECORDS
document.addEventListener("DOMContentLoaded", function () {
  const archiveButton = document.getElementById("archiveRecordButton");

  if (!archiveButton) {
    console.error(" Error: Archive button not found.");
    return;
  }

  //  Remove any previous event listener before adding a new one
  archiveButton.removeEventListener("click", handleArchiveRequest);
  archiveButton.addEventListener("click", handleArchiveRequest);
});

async function handleArchiveRequest() {
  //  Prevent multiple clicks by disabling the button
  const archiveButton = document.getElementById("archiveRecordButton");
  if (!archiveButton) return;

  if (archiveButton.disabled) return; // Prevent duplicate requests
  archiveButton.disabled = true; // Disable button to prevent spam clicking

  const confirmArchive = confirm(
    " Are you sure you want to archive the record contents?"
  );
  if (!confirmArchive) {
    archiveButton.disabled = false; // Re-enable button if canceled
    return;
  }

  try {
    console.log("📨 Sending archive request...");

    const response = await fetch("/api/archiveRecords", { method: "POST" });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log(" Archive Response:", result);

    if (result.message) {
      alert(result.message);
      fetchFiles(); //  Refresh record box after archiving
    } else {
      alert(" Error: " + (result.error || "Unknown error"));
    }
  } catch (error) {
    console.error(" Failed to archive record content:", error);
    alert(" Failed to connect to archive API.");
  } finally {
    archiveButton.disabled = false; //  Re-enable button after request completes
  }
}

//====================================================================================================
//SHOW ARCHIVES
document.getElementById("show-archives").addEventListener("click", function () {
  const archiveFolderId = "1GM5-ZA57QPylEhcMexwhhVmdd2g09ZRX"; // Replace with actual archive folder ID
  const archiveURL = `https://drive.google.com/drive/folders/${archiveFolderId}`;
  window.open(archiveURL, "_blank"); //  Open in a new tab
});
//====================================================================================================

document
  .getElementById("archiveRecordButton")
  .addEventListener("click", async function () {
    if (this.disabled) return;
    this.disabled = true;

    const confirmArchive = confirm(
      " Are you sure you want to archive the record contents?"
    );
    if (!confirmArchive) {
      this.disabled = false;
      return;
    }

    try {
      console.log("📨 Sending archive request...");
      const response = await fetch("/api/archiveRecords", { method: "POST" });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log(" Archive Response:", result);

      if (result.message) {
        alert(result.message);
        fetchFiles();
        if (result.pdf_link) {
          window.open(result.pdf_link, "_blank");
        }
      } else {
        alert(" Error: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error(" Failed to archive record content:", error);
      alert(" Failed to connect to archive API.");
    } finally {
      this.disabled = false;
    }
  });
