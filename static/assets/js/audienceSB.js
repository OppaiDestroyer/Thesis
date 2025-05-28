const socket = io(); // Initialize WebSocket connection

socket.on("connect", function () {
  console.log("Connected to WebSocket server");
});

socket.on("game_state", function (data) {
  console.log("Received game state:", data.state);

  if (data.state === "waiting-start") {
    nextStep("waiting-players", "waiting-start");
  } else if (data.state === "player-container") {
    nextStep("waiting-start", "player-container");
  } else if (data.state === "waiting-result") {
    nextStep("player-container", "waiting-result");
  } else if (data.state === "winner-details") {
    nextStep("waiting-result", "winner-details");
    setTimeout(() => {
      nextStep("winner-details", "waiting-players");
    }, 10000);
  }

  if (data.state === "waiting-start") {
    nextStep("waiting-players", "waiting-start");
  } else if (data.state === "player-container") {
    nextStep("waiting-start", "player-container");
  } else if (data.state === "waiting-result") {
    nextStep("player-container", "waiting-result");
  } else if (data.state === "winner-details") {
    nextStep("waiting-result", "winner-details");
    setTimeout(() => {
      nextStep("winner-details", "waiting-players");
    }, 10000);
  }
});

socket.on("start_game", function (data) {
  console.log("Received player details:", data); // Debugging

  // Check if player data is valid (not empty strings)
  if (
    !data ||
    !data.playerName.trim() ||
    !data.category.trim() ||
    !data.belt.trim() ||
    !data.gym.trim() ||
    !data.performance.trim()
  ) {
    console.error("Invalid player data received:", data);
    // Stay on "waiting-start" screen if no player is registered
    return false;
  }

  if (!data || !data.playerName) {
    console.error("Invalid player data received:", data);
    return;
  }

  // Show the player container
  nextStep("waiting-start", "player-container");

  // Update player information
  document.getElementById("player-name").innerText =
    data.playerName || "Unknown";
  document.getElementById("player-category").innerText =
    data.category || "Unknown";
  document.getElementById("player-belt").innerText = data.belt || "Unknown";
  document.getElementById("player-gym").innerText = data.gym || "Unknown";
  document.getElementById("performance").innerText =
    data.performance || "Form 1";

  const loadingHTML = `
    <div class="score-loading">
      <div class="loader"></div>
      <div class="waiting-text">Waiting for result...</div>
    </div>
  `;

  document.getElementById("accuracy-score").innerHTML = loadingHTML;
  document.getElementById("presentation-score").innerHTML = loadingHTML;
  document.getElementById("total-score").innerHTML = loadingHTML;
});

socket.on("update_score", function (data) {
  console.log("Received updated score:", data); // Debugging

  document.getElementById("accuracy-score").innerText = data.accuracy;
  document.getElementById("presentation-score").innerText = data.presentation;
  document.getElementById("total-score").innerText = data.total;
});

// Function to move to the next step (same as in admin)
function nextStep(currentId, nextId) {
  // Hide all sections first (this makes sure there are no conflicting visible elements)
  const sections = [
    "waiting-start",
    "waiting-players",
    "player-container",
    "waiting-result",
    "winner-details",
  ];
  sections.forEach((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.classList.add("hidden"); // Hide all sections
    }
  });

  // Now show the next section
  const nextElement = document.getElementById(nextId);
  if (nextElement) {
    nextElement.classList.remove("hidden"); // Show the next section
  }

  // If we're going to "waiting-players", clear the match results and winner details
  if (nextId === "waiting-players") {
    clearMatchResult();
  }
}

// Function to clear result and winner details (without hiding)
function clearMatchResult() {
  const waitingResult = document.getElementById("waiting-result");
  const winnerDetails = document.getElementById("winner-details");

  // Clear the content of "waiting-result" and "winner-details"
  if (waitingResult) {
    waitingResult.innerHTML = ""; // Clear the content of waiting-result
  }

  if (winnerDetails) {
    winnerDetails.innerHTML = ""; // Clear the content of winner-details
  }
  document.getElementById(currentId).classList.add("hidden");
  document.getElementById(nextId).classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", function () {
  socket.on("winner_displayed", function (data) {
    console.log("[DEBUG] Winner event received:", data); // 🔴 Debugging log

    const winnerDetails = document.getElementById("winner-details");
    const winnerName = document.getElementById("winner-name");
    const winnerCategory = document.getElementById("winner-category");
    const winnerBelt = document.getElementById("winner-belt");
    const winnerGym = document.getElementById("winner-gym");
    const winnerScore = document.getElementById("winner-score");

    // Debugging: Check if elements exist before updating
    if (
      !winnerDetails ||
      !winnerName ||
      !winnerCategory ||
      !winnerBelt ||
      !winnerGym ||
      !winnerScore
    ) {
      console.error(
        "[ERROR] Winner display elements are missing from the DOM!"
      );
      return;
    }

    // Clear any previous content in the winner details section
    winnerDetails.innerHTML = ""; // Ensure previous content is cleared

    if (data.winner === "DRAW") {
      console.log("[DEBUG] It's a draw!"); // 🔴 Debugging log
      winnerDetails.innerHTML = `<h2>⚖️ It's a Draw!</h2>`;
    } else {
      console.log("[DEBUG] Updating winner details for:", data.winnerData.name); // 🔴 Debugging log
      // Update winner details
      winnerDetails.innerHTML = `
                <h2>🏆 Winner!</h2>
                <p><strong>Name:</strong> ${data.winnerData.name}</p>
                <p><strong>Category:</strong> ${data.winnerData.category}</p>
                <p><strong>Belt:</strong> ${data.winnerData.belt}</p>
                <p><strong>Gym:</strong> ${data.winnerData.gym}</p>
                <p><strong>Total Score:</strong> ${data.winnerData.totalScore}</p>
            `;
    }

    nextStep("waiting-result", "winner-details");
  });

  if (data.winner === "DRAW") {
    console.log("[DEBUG] It's a draw!"); // 🔴 Debugging log
    winnerDetails.innerHTML = `<h2>⚖️ It's a Draw!</h2>`;
  } else {
    console.log("[DEBUG] Updating winner details for:", data.winnerData.name); // 🔴 Debugging log
    // Update winner details
    winnerName.innerText = data.winnerData.name;
    winnerCategory.innerText = data.winnerData.category;
    winnerBelt.innerText = data.winnerData.belt;
    winnerGym.innerText = data.winnerData.gym;
    winnerScore.innerText = data.winnerData.totalScore;
  }

  // Show the winner screen
  winnerDetails.classList.remove("hidden");
});

// document.addEventListener("DOMContentLoaded", () => {
//   const nextBtn = document.getElementById("next");
//   const waitingPlayers = document.getElementById("waiting-players");
//   const waitingStart = document.getElementById("waiting-start");
//   const playerContainer = document.getElementById("player-container");

//   nextBtn.addEventListener("click", () => {
//     // Hide the waiting players screen
//     waitingPlayers.classList.add("hidden");

//     // Show the player scoring screen for testing
//     playerContainer.classList.remove("hidden");

//     // Populate dummy data for testing
//     document.getElementById("player-name").textContent = "John Doe";
//     document.getElementById("player-category").textContent = "Junior Male";
//     document.getElementById("player-belt").textContent = "Red";
//     document.getElementById("player-gym").textContent = "Eagle Taekwondo Gym";
//     document.getElementById("performance").textContent = "Taegeuk 5 Jang";
//     document.getElementById("accuracy-score").textContent = "4";
//     document.getElementById("presentation-score").textContent = "6";
//     document.getElementById("total-score").textContent = "10";
//   });
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const playerNextBtn = document.getElementById("nextB");
//   const playerContainer = document.getElementById("player-container");
//   const waitingResult = document.getElementById("waiting-result");

//   if (playerNextBtn) {
//     playerNextBtn.addEventListener("click", () => {
//       // Hide player scoring screen
//       playerContainer.classList.add("hidden");

//       // Show winner details screen
//       waitingResult.classList.remove("hidden");

//       // Inject dummy winner data
//       //   document.getElementById("winner-name").textContent = "Jane Smith";
//       //   document.getElementById("winner-category").textContent = "Senior Female";
//       //   document.getElementById("winner-belt").textContent = "Black";
//       //   document.getElementById("winner-gym").textContent = "Tiger Martial Arts";
//       //   document.getElementById("winner-score").textContent = "18.5";
//     });
//   }
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const playerNextBtn = document.getElementById("nextC");
//   const waitingResult = document.getElementById("waiting-result");
//   const winnerDetails = document.getElementById("winner-details");
//   if (playerNextBtn) {
//     playerNextBtn.addEventListener("click", () => {
//       // Hide player scoring screen
//       waitingResult.classList.add("hidden");

//       // Show winner details screen
//       winnerDetails.classList.remove("hidden");

//       // Inject dummy winner data
//       document.getElementById("winner-name").textContent = "Jane Smith";
//       document.getElementById("winner-category").textContent = "Senior Female";
//       document.getElementById("winner-belt").textContent = "Black";
//       document.getElementById("winner-gym").textContent = "Tiger Martial Arts";
//       document.getElementById("winner-score").textContent = "18.5";
//     });
//   }
// });
