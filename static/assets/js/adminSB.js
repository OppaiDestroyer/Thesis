document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  let currentPerforming = "";
  let waitingForRFID = null;
  let isScoringActive = false;
  let playerStarted = { 1: false, 2: false };
  let registeredRFIDs = {};
  let gameNumber = 1; // Global game counter

  socket.on("rfid_data", function (data) {
    if (!waitingForRFID) {
      console.warn("RFID scan ignored — not waiting for a player.");
      return;
    }

    if (isScoringActive) return;

    const rfid = data.rfid;
    console.log("RFID Scanned:", rfid);

    // Duplicate check here:
    for (const key in registeredRFIDs) {
      if (registeredRFIDs[key] === rfid) {
        alert(`RFID already registered to Player ${key}. Use a different tag.`);
        resetRegisterButton(waitingForRFID);
        return;
      }
    }

    fetch(`/get_player/${rfid}`)
      .then((response) => response.json())
      .then((player) => {
        if (!player) {
          updatePlayerStatus(waitingForRFID, "Not Registered");
          resetRegisterButton(waitingForRFID);
          return;
        }

        if (registeredRFIDs[waitingForRFID]) {
          unregisterPlayer(waitingForRFID);
        }

        assignPlayer(waitingForRFID, rfid, player);
        resetRegisterButton(waitingForRFID);
        socket.emit("update_audience", { registeredRFIDs });
      })
      .catch((error) => console.error("Error fetching player:", error));
  });

  function assignPlayer(playerNumber, rfid, player) {
    updatePlayerInfo(playerNumber, player);
    registeredRFIDs[playerNumber] = rfid;
    waitingForRFID = null;
    if (registeredRFIDs[1] && registeredRFIDs[2]) {
      waitingForRFID = null;
      console.log("Both players registered. Moving to next step...");

      // 🔴 Emit an event so the audience screen updates too
      socket.emit("game_state", { state: "waiting-start" });
    }
  }

  function unregisterPlayer(playerNumber) {
    delete registeredRFIDs[playerNumber];

    document.getElementById(`player${playerNumber}-name`).innerText = "";
    document.getElementById(`player${playerNumber}-category`).innerText = "";
    document.getElementById(`player${playerNumber}-belt`).innerText = "";
    document.getElementById(`player${playerNumber}-gym`).innerText = "";
    document.querySelector(`.player${playerNumber}-detected`).innerText = "";
  }

  function updatePlayerInfo(playerNumber, player) {
    const fullName = `${player.firstname || ""} ${player.middlename || ""} ${
      player.lastname || ""
    }`.trim();

    document.getElementById(`player${playerNumber}-name`).innerText =
      fullName || "";
    document.getElementById(`player${playerNumber}-category`).innerText =
      player.category || "";
    document.getElementById(`player${playerNumber}-belt`).innerText =
      player.belt || "";
    document.getElementById(`player${playerNumber}-gym`).innerText =
      player.gym || "";
    document.querySelector(`.player${playerNumber}-detected`).innerText =
      "Registered";
  }

  function updatePlayerStatus(playerNumber, status) {
    document.querySelector(`.player${playerNumber}-detected`).innerText =
      status;
  }

  function resetRegisterButton(playerNumber) {
    const registerButton = document.querySelector(
      `.player${playerNumber}-register`
    );
    if (registerButton)
      registerButton.innerText = `Register Player ${playerNumber}`;
  }

  document
    .querySelector(".player1-register")
    .addEventListener("click", function () {
      if (isScoringActive || waitingForRFID) return;
      document.querySelector(`.player1-detected`).innerText = "Detecting...";
      waitingForRFID = 1;
    });

  document
    .querySelector(".player2-register")
    .addEventListener("click", function () {
      if (isScoringActive || waitingForRFID) return;
      document.querySelector(`.player2-detected`).innerText = "Detecting...";
      waitingForRFID = 2;
    });

  function generateRandomScores(playerNumber) {
    if (!registeredRFIDs[1] || !registeredRFIDs[2]) {
      alert("Both players must be registered before starting!");
      return;
    }

    if (playerStarted[playerNumber]) return;

    playerStarted[playerNumber] = true;
    isScoringActive = true;

    if (!playerStarted[1] && !playerSubmitted[1]) {
      alert("Player 1 must start before Player 2!");
      return;
    }

    socket.on(
      "scoreUpdate",
      ({ playerNumber, accuracyScore, presentationScore }) => {
        // ignore if player not in a “started” state
        if (!playerStarted[player]) return;

        document.getElementById(
          `player${playerNumber}-accuracy-score`
        ).innerText = accuracyScore.toFixed(1);
        document.getElementById(
          `player${playerNumber}-presentation-score`
        ).innerText = presentationScore.toFixed(1);

        const totalScore =
          parseFloat(accuracyScore) + parseFloat(presentationScore);
        document.getElementById(`player${playerNumber}-total-score`).innerText =
          totalScore.toFixed(1);

        playerStarted[player] = false;
      }
    );

    // If currentPerforming is not set, generate it (based on both players’ belt)
    if (!currentPerforming) {
      // Get belt values (assumed to be already set by registration)
      const belt1 = document.getElementById("player1-belt").innerText.trim();
      const belt2 = document.getElementById("player2-belt").innerText.trim();

      // Check if belts match exactly
      if (belt1 !== belt2) {
        alert("Player belts do not match. Unregistering both players.");
        unregisterPlayer(1);
        unregisterPlayer(2);
        return;
      }

      // Normalize for comparison
      const sameBelt = belt1.toLowerCase();

      // Mapping of belt levels to forms
      const beltToForm = {
        "low yellow": "Taeguk 1",
        "high yellow": "Taeguk 2",
        "low blue": "Taeguk 3",
        "high blue": "Taeguk 4",
        "low red": "Taeguk 5",
        "high red": "Taeguk 6",
        "low brown": "Taeguk 7",
        "high brown": "Taeguk 8",
      };

      // Black belt pool
      const blackBeltForms = ["Koryo", "Keumgang", "Taebek"];

      // Check if it's a black belt
      const isBlackBelt = (belt) => belt.toLowerCase().includes("black belt");

      if (isBlackBelt(belt1)) {
        const randomIndex = Math.floor(Math.random() * blackBeltForms.length);
        currentPerforming = blackBeltForms[randomIndex];
      } else {
        // Use mapped form
        currentPerforming = beltToForm[sameBelt] || "Taeguk 1"; // fallback if undefined
      }

      // Assign the same performing value to both players
      document.getElementById("player1-performing").innerText =
        currentPerforming;
      document.getElementById("player2-performing").innerText =
        currentPerforming;
    }
  }

  function displayWinner() {
    // Get necessary DOM elements for totals and submission status
    const player1TotalEl = document.getElementById("player1-total-score");
    const player2TotalEl = document.getElementById("player2-total-score");
    const player1SubmitEl = document.getElementById("player1-submit");
    const player2SubmitEl = document.getElementById("player2-submit");

    // Check if elements exist
    if (
      !player1TotalEl ||
      !player2TotalEl ||
      !player1SubmitEl ||
      !player2SubmitEl
    ) {
      console.error("Error: One or more elements are missing!");
      alert("Error: Required elements are missing in the DOM.");
      return;
    }

    // Parse totals
    const player1Total = parseFloat(player1TotalEl.innerText) || 0;
    const player2Total = parseFloat(player2TotalEl.innerText) || 0;

    // Check submission status
    const player1Submitted = player1SubmitEl.value === "true";
    const player2Submitted = player2SubmitEl.value === "true";

    if (!player1Submitted || !player2Submitted) {
      alert("Error: Both players must submit their scores first!");
      return;
    }

    // Determine winner
    let winnerText = "";
    let winnerNumber = null;
    let winnerData = null;

    if (player1Total > player2Total) {
      winnerText = "🏆 Player 1 Wins!";
      winnerNumber = 1;
      winnerData = getPlayerData(1);
      console.log("[DEBUG] Emitting PLAYER1_WIN:", winnerData);
      socket.emit("winner_displayed", { winner: "PLAYER1_WIN", winnerData });
    } else if (player2Total > player1Total) {
      winnerText = "🏆 Player 2 Wins!";
      winnerNumber = 2;
      winnerData = getPlayerData(2);
      console.log("[DEBUG] Emitting PLAYER2_WIN:", winnerData);
      socket.emit("winner_displayed", { winner: "PLAYER2_WIN", winnerData });
    } else {
      winnerText = "🤝 It's a Tie!";
      console.log("[DEBUG] Emitting DRAW");
      socket.emit("winner_displayed", { winner: "DRAW" });
    }

    // Gather player details
    const player1Info = getPlayerInfo(1, winnerText, winnerNumber);
    const player2Info = getPlayerInfo(2, winnerText, winnerNumber);

    // Post the game info to the server
    const gameData = {
      game: gameNumber,
      players: [player1Info, player2Info],
    };

    // Save game data in MongoDB
    fetch("/api/winners/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gameData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Game data saved successfully:", data);
      })
      .catch((error) => {
        console.error("Error saving game data:", error);
      });

    // Alert the winner
    alert(winnerText);

    // Increment game number for the next match
    gameNumber++;

    // Reset the game
    resetGame();
  }

  function getPlayerData(playerNumber) {
    return {
      name: document.getElementById(`player${playerNumber}-name`).innerText,
      category: document.getElementById(`player${playerNumber}-category`)
        .innerText,
      belt: document.getElementById(`player${playerNumber}-belt`).innerText,
      gym: document.getElementById(`player${playerNumber}-gym`).innerText,
      totalScore: parseFloat(
        document.getElementById(`player${playerNumber}-total-score`).innerText
      ),
    };
  }

  function getPlayerInfo(playerNumber, winnerText, winnerNumber) {
    const playerInfo = {
      name: document.getElementById(`player${playerNumber}-name`).innerText,
      belt: document.getElementById(`player${playerNumber}-belt`).innerText,
      gym: document.getElementById(`player${playerNumber}-gym`).innerText,
      category: document.getElementById(`player${playerNumber}-category`)
        .innerText,
      accuracy: document.getElementById(`player${playerNumber}-accuracy-score`)
        .innerText,
      presentation: document.getElementById(
        `player${playerNumber}-presentation-score`
      ).innerText,
      totalScore: document.getElementById(`player${playerNumber}-total-score`)
        .innerText,
      performing: document.getElementById(`player${playerNumber}-performing`)
        .innerText,
      status: winnerText.includes(`Player ${playerNumber}`)
        ? "Winner"
        : "Loser",
      game: gameNumber,
    };
    return playerInfo;
  }

  function resetGame() {
    console.log("Resetting game...");

    // Reset global variables and player details
    waitingForRFID = null;
    isScoringActive = false;
    playerStarted = { 1: false, 2: false };
    playerSubmitted = { 1: false, 2: false };
    registeredRFIDs = {};

    // Reset scores and player info
    resetPlayerInfo(1);
    resetPlayerInfo(2);

    console.log("Game reset. Ready for a new match.");
  }

  function resetPlayerInfo(playerNumber) {
    document.getElementById(`player${playerNumber}-total-score`).innerText =
      "10";
    document.getElementById(`player${playerNumber}-accuracy-score`).innerText =
      "4";
    document.getElementById(
      `player${playerNumber}-presentation-score`
    ).innerText = "6";
    document.getElementById(`player${playerNumber}-accuracy-deduction`).value =
      "";
    document.getElementById(
      `player${playerNumber}-presentation-deduction`
    ).value = "";
    document.getElementById(`player${playerNumber}-performing`).innerText = "";
    document.getElementById(`player${playerNumber}-name`).innerText = "";
    document.getElementById(`player${playerNumber}-category`).innerText = "";
    document.getElementById(`player${playerNumber}-belt`).innerText = "";
    document.getElementById(`player${playerNumber}-gym`).innerText = "";
    document.querySelector(`.player${playerNumber}-detected`).innerText =
      "Not Registered";
    document.getElementById(`player${playerNumber}-submit`).value = "false";
  }

  socket.on(
    "new_score",
    ({ playerNumber, accuracyScore, presentationScore }) => {
      console.log(`[SOCKET] New score received for Player ${playerNumber}`);
      console.log(
        `Accuracy: ${accuracyScore}, Presentation: ${presentationScore}`
      );

      const totalScore =
        parseFloat(accuracyScore) + parseFloat(presentationScore);

      document.getElementById(
        `player${playerNumber}-accuracy-score`
      ).innerText = accuracyScore.toFixed(1);
      document.getElementById(
        `player${playerNumber}-presentation-score`
      ).innerText = presentationScore.toFixed(1);
      document.getElementById(`player${playerNumber}-total-score`).innerText =
        totalScore.toFixed(1);

      console.log(`[UI] Scores updated for Player ${playerNumber}`);
    }
  );
  function submitScores(playerNumber) {
    // Ensure player is registered and has started
    if (!isPlayerValid(playerNumber)) {
      return;
    }

    const accuracyScore = Number(updateScore(playerNumber, "accuracy")) || 0;
    const presentationScore =
      Number(updateScore(playerNumber, "presentation")) || 0;

    // Calculate total score and update
    const totalScore = accuracyScore + presentationScore;
    document.getElementById(`player${playerNumber}-total-score`).innerText =
      totalScore.toFixed(2);

    // Mark as submitted
    document.getElementById(`player${playerNumber}-submit`).value = "true";

    // Disable the submit button
    const submitBtn = document.getElementById(
      `player${playerNumber}-submit-btn`
    );
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    // Emit the updated score to the server, including total
    socket.emit("update_score", {
      playerNumber: playerNumber,
      accuracy: accuracyScore,
      presentation: presentationScore,
      total: totalScore,
    });

    console.log(`✅ Player ${playerNumber} submitted their score.`, {
      accuracy: accuracyScore,
      presentation: presentationScore,
      total: totalScore,
    });
  }

  function isPlayerValid(playerNumber) {
    const playerDetectedElement = document.getElementById(
      `player${playerNumber}-detected`
    );
    const playerRegistered =
      playerDetectedElement &&
      playerDetectedElement.innerText !== "Not Registered";
    if (!playerRegistered) {
      alert(
        `Error: Player ${playerNumber} must be registered before submitting scores!`
      );
      return false;
    }
    if (!playerStarted[playerNumber]) {
      alert(`Error: Player ${playerNumber} has not started yet!`);
      return false;
    }
    return true;
  }

  function updateScore(playerNumber, scoreType) {
    const scoreElement = document.getElementById(
      `player${playerNumber}-${scoreType}-score`
    );
    const deductionElement = document.getElementById(
      `player${playerNumber}-${scoreType}-deduction`
    );
    const score = parseFloat(scoreElement.innerText) || 0;
    const deduction = parseFloat(deductionElement.value) || 0;
    const newScore = Math.max(score - deduction, 0);
    scoreElement.innerText = newScore.toFixed(1);
    return newScore;
  }

  // Event Listener for Player 1 Submit Button
  document
    .querySelector(".player1-submit")
    .addEventListener("click", function () {
      submitScores(1);

      // 🔓 Re-enable all buttons
      document.querySelectorAll("button").forEach((btn) => {
        btn.disabled = false;
      });

      setTimeout(() => {
        socket.emit("game_state", { state: "waiting-start" });
      }, 10000);
    });

  // Event Listener for Player 2 Submit Button
  document
    .querySelector(".player2-submit")
    .addEventListener("click", function () {
      submitScores(2);
      setTimeout(() => {
        socket.emit("game_state", { state: "waiting-result" });
      }, 10000);
    });

  // Event listener for the Display button
  document.querySelector(".displayBtn").addEventListener("click", function () {
    console.log("Display button clicked.");
    displayWinner();
    socket.emit("game_state", { state: "waiting-reset" });
  });

  //======================================start========================================
  document
    .querySelector(".player1-start")
    .addEventListener("click", function () {
      if (!registeredRFIDs[1]) {
        alert("Error: Player 1 must be registered before starting!");
        return;
      }
      if (!registeredRFIDs[2]) {
        alert("Error: Player 2 must be registered before starting!");
        return;
      }
      document.querySelectorAll("button").forEach((btn) => {
        if (!btn.classList.contains("player1-submit")) {
          btn.disabled = true;
        }
      });

      generateRandomScores(1);

      const playerData = {
        playerName: document.getElementById("player1-name").innerText,
        category: document.getElementById("player1-category").innerText,
        belt: document.getElementById("player1-belt").innerText,
        gym: document.getElementById("player1-gym").innerText,
        performance: document.getElementById("player1-performing").innerText,
      };
      console.log("Sending player 1 data:", playerData);
      socket.emit("start_game", playerData);
      socket.emit("game_state", { state: "player-container" });
      socket.emit("player_started", { player: 1, playerData });
    });

  document
    .querySelector(".player2-start")
    .addEventListener("click", function () {
      if (!playerStarted[1] && !playerSubmitted[1]) {
        alert("Player 1 must start before Player 2!");
        return;
      }
      generateRandomScores(2);

      const playerData = {
        playerName: document.getElementById("player2-name").innerText,
        category: document.getElementById("player2-category").innerText,
        belt: document.getElementById("player2-belt").innerText,
        gym: document.getElementById("player2-gym").innerText,
        performance: document.getElementById("player2-performing").innerText,
      };
      console.log("Sending player 2 data:", playerData);
      socket.emit("game_state", { state: "player-container" });
      socket.emit("start_game", playerData);
      socket.emit("player_started", { player: 2, playerData });
    });

  //======================================start========================================
});
