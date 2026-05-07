// Timer State Management
class RacingTimer {
    constructor(id) {
        this.id = id;
        this.startTime = null;
        this.elapsedTime = 0;
        this.running = false;
        this.interval = null;
        this.laps = [];
        this.currentLap = 0;
        this.lastLapTime = 0;
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.startTime = Date.now() - this.elapsedTime;
            this.interval = setInterval(() => this.updateDisplay(), 10);
            updateStatus(this.id, 'Running');
        }
    }

    recordLap() {
        if (!this.running) return false;

        const maxLaps = parseInt(document.getElementById('lapCount').value);
        if (this.currentLap >= maxLaps) {
            this.stop();
            return false;
        }

        this.currentLap++;
        const currentTime = Date.now() - this.startTime;
        const lapTime = currentTime - this.lastLapTime;

        this.laps.push({
            lapNumber: this.currentLap,
            lapTime: lapTime,
            totalTime: currentTime
        });

        this.lastLapTime = currentTime;
        displayLap(this.id, this.currentLap, lapTime);
        document.getElementById(`timer${this.id}Lap`).textContent = this.currentLap;

        // Check if race is complete
        if (this.currentLap >= maxLaps) {
            this.stop();
            updateStatus(this.id, 'Finished!');
            addToLeaderboard(this.id, currentTime, this.laps);
            return true;
        }

        return false;
    }

    stop() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    reset() {
        this.stop();
        this.startTime = null;
        this.elapsedTime = 0;
        this.laps = [];
        this.currentLap = 0;
        this.lastLapTime = 0;
        this.updateDisplay();
        document.getElementById(`timer${this.id}Laps`).innerHTML = '';
        document.getElementById(`timer${this.id}Lap`).textContent = '0';
        updateStatus(this.id, 'Ready');
    }

    updateDisplay() {
        if (this.running) {
            this.elapsedTime = Date.now() - this.startTime;
        }
        const display = document.getElementById(`timer${this.id}Display`);
        display.textContent = formatTime(this.elapsedTime);
    }
}

// Global Timers
const timer1 = new RacingTimer(1);
const timer2 = new RacingTimer(2);

// Format time as MM:SS.mmm
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000));

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Update status message
function updateStatus(timerId, message) {
    document.getElementById(`timer${timerId}Status`).textContent = message;
}

// Display lap time
function displayLap(timerId, lapNumber, lapTime) {
    const lapsList = document.getElementById(`timer${timerId}Laps`);
    const lapItem = document.createElement('div');
    lapItem.className = 'lap-item';
    lapItem.innerHTML = `
        <span class="lap-number">Lap ${lapNumber}</span>
        <span class="lap-time">${formatTime(lapTime)}</span>
    `;
    lapsList.appendChild(lapItem);

    // Scroll to bottom
    lapsList.scrollTop = lapsList.scrollHeight;
}

// Leaderboard Management
let leaderboard = [];

function addToLeaderboard(carId, totalTime, laps) {
    const carName = document.getElementById(`car${carId}Name`).value || `Car ${carId}`;

    const entry = {
        carId: carId,
        carName: carName,
        totalTime: totalTime,
        laps: laps,
        timestamp: Date.now()
    };

    leaderboard.push(entry);
    leaderboard.sort((a, b) => a.totalTime - b.totalTime);

    // Save to localStorage
    saveLeaderboard();
    displayLeaderboard();
}

function displayLeaderboard() {
    const list = document.getElementById('leaderboardList');

    if (leaderboard.length === 0) {
        list.innerHTML = '<div class="no-records">No completed races yet</div>';
        return;
    }

    list.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item rank-${index + 1}`;
        item.innerHTML = `
            <div class="rank">#${index + 1}</div>
            <div class="car-name">${entry.carName}</div>
            <div class="total-time">${formatTime(entry.totalTime)}</div>
            <button class="details-btn" onclick="toggleDetails(this, ${index})">Details</button>
        `;
        list.appendChild(item);
    });

    // Highlight fastest lap
    highlightFastestLaps();
}

function toggleDetails(button, index) {
    const item = button.closest('.leaderboard-item');
    const existingDetails = item.querySelector('.lap-details');

    if (existingDetails) {
        existingDetails.remove();
        button.textContent = 'Details';
        return;
    }

    const entry = leaderboard[index];
    const details = document.createElement('div');
    details.className = 'lap-details';

    let detailsHTML = '<div class="lap-details-grid">';
    entry.laps.forEach(lap => {
        detailsHTML += `
            <div class="lap-detail-item">
                <strong>Lap ${lap.lapNumber}</strong><br>
                ${formatTime(lap.lapTime)}
            </div>
        `;
    });
    detailsHTML += '</div>';

    details.innerHTML = detailsHTML;
    item.appendChild(details);
    button.textContent = 'Hide';

    // Highlight fastest lap in details
    const fastestLapIndex = entry.laps.reduce((fastest, lap, idx) =>
        lap.lapTime < entry.laps[fastest].lapTime ? idx : fastest, 0);
    const lapItems = details.querySelectorAll('.lap-detail-item');
    if (lapItems[fastestLapIndex]) {
        lapItems[fastestLapIndex].classList.add('fastest');
    }
}

function highlightFastestLaps() {
    // Find fastest lap for timer 1
    const timer1Laps = document.querySelectorAll('#timer1Laps .lap-item');
    if (timer1Laps.length > 0 && timer1.laps.length > 0) {
        const fastestIdx = timer1.laps.reduce((fastest, lap, idx) =>
            lap.lapTime < timer1.laps[fastest].lapTime ? idx : fastest, 0);
        timer1Laps[fastestIdx]?.classList.add('fastest');
    }

    // Find fastest lap for timer 2
    const timer2Laps = document.querySelectorAll('#timer2Laps .lap-item');
    if (timer2Laps.length > 0 && timer2.laps.length > 0) {
        const fastestIdx = timer2.laps.reduce((fastest, lap, idx) =>
            lap.lapTime < timer2.laps[fastest].lapTime ? idx : fastest, 0);
        timer2Laps[fastestIdx]?.classList.add('fastest');
    }
}

// LocalStorage Management
function saveLeaderboard() {
    localStorage.setItem('racingLeaderboard', JSON.stringify(leaderboard));
}

function loadLeaderboard() {
    const saved = localStorage.getItem('racingLeaderboard');
    if (saved) {
        leaderboard = JSON.parse(saved);
        displayLeaderboard();
    }
}

// Update lap count display
function updateLapCountDisplay() {
    const count = document.getElementById('lapCount').value;
    document.querySelectorAll('.total-laps').forEach(el => {
        el.textContent = count;
    });
}

// Event Listeners - Buttons
document.addEventListener('DOMContentLoaded', () => {
    // Load saved leaderboard
    loadLeaderboard();

    // Car name change listeners
    document.getElementById('car1Name').addEventListener('input', (e) => {
        const name = e.target.value || 'Car 1';
        document.querySelector('#car1Title .car-name-display').textContent = name;
    });

    document.getElementById('car2Name').addEventListener('input', (e) => {
        const name = e.target.value || 'Car 2';
        document.querySelector('#car2Title .car-name-display').textContent = name;
    });

    // Lap count change
    document.getElementById('lapCount').addEventListener('change', updateLapCountDisplay);

    // Start Both button
    document.getElementById('startBoth').addEventListener('click', () => {
        timer1.start();
        timer2.start();
    });

    // Reset All button
    document.getElementById('resetAll').addEventListener('click', () => {
        if (confirm('Reset all timers and clear leaderboard?')) {
            timer1.reset();
            timer2.reset();
            leaderboard = [];
            localStorage.removeItem('racingLeaderboard');
            displayLeaderboard();
        }
    });

    // Timer 1 controls
    document.querySelector('.btn-start[data-timer="1"]').addEventListener('click', () => {
        timer1.start();
    });

    document.querySelector('.btn-lap[data-timer="1"]').addEventListener('click', () => {
        timer1.recordLap();
    });

    document.querySelector('.btn-reset[data-timer="1"]').addEventListener('click', () => {
        timer1.reset();
    });

    // Timer 2 controls
    document.querySelector('.btn-start[data-timer="2"]').addEventListener('click', () => {
        timer2.start();
    });

    document.querySelector('.btn-lap[data-timer="2"]').addEventListener('click', () => {
        timer2.recordLap();
    });

    document.querySelector('.btn-reset[data-timer="2"]').addEventListener('click', () => {
        timer2.reset();
    });
});

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    // Prevent default if input is not focused
    if (document.activeElement.tagName !== 'INPUT') {
        switch(e.key) {
            case '1':
                e.preventDefault();
                timer1.recordLap();
                break;
            case '2':
                e.preventDefault();
                timer2.recordLap();
                break;
            case ' ':
                e.preventDefault();
                timer1.start();
                timer2.start();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                if (confirm('Reset all timers?')) {
                    timer1.reset();
                    timer2.reset();
                }
                break;
        }
    }
});

// Initial setup
updateLapCountDisplay();
