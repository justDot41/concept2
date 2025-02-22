const socket = io();

// Load saved settings
window.addEventListener('load', () => {
    const savedSettings = JSON.parse(localStorage.getItem('timerSettings') || '{}');
    if (savedSettings.prepTime) document.getElementById('prepTime').value = savedSettings.prepTime;
    if (savedSettings.workTime) document.getElementById('workTime').value = savedSettings.workTime;
    if (savedSettings.restTime) document.getElementById('restTime').value = savedSettings.restTime;
    if (savedSettings.repeats) document.getElementById('repeats').value = savedSettings.repeats;
});

let isPaused = false;
document.getElementById('pauseButton')?.addEventListener('click', () => {
    isPaused = !isPaused;
    socket.emit('pauseTimer', isPaused);
});

document.getElementById('intervalForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Save settings
    const settings = {
        prepTime: document.getElementById('prepTime').value,
        workTime: document.getElementById('workTime').value,
        restTime: document.getElementById('restTime').value,
        repeats: document.getElementById('repeats').value
    };
    localStorage.setItem('timerSettings', JSON.stringify(settings));
    
    const prepTime = parseInt(document.getElementById('prepTime').value);
    const workTime = parseInt(document.getElementById('workTime').value);
    const restTime = parseInt(document.getElementById('restTime').value);
    const repeats = parseInt(document.getElementById('repeats').value);

    // Отправляем данные на сервер
    socket.emit('startTimer', { prepTime, workTime, restTime, repeats });
});

socket.on('timerError', (message) => {
    alert(message);
});

socket.on('timerUpdate', (data) => {
    const { workTime, restTime, repeats, currentRepeat, isWorking, timeLeft } = data;
    const timerDisplay = document.getElementById('timer');
    const form = document.getElementById('intervalForm');
    form.classList.add('hidden');

    if (currentRepeat >= repeats && !isWorking) {
        timerDisplay.textContent = 'Тренировка завершена!';
        document.getElementById('intervalForm').classList.remove('hidden');
        return;
    }

    let phase, progress;
    if (data.isPreparing) {
        phase = 'ПОДГОТОВКА';
        progress = 'Приготовьтесь к началу';
        
        // Add preparation phase classes
        timerDisplay.classList.remove('prep-phase-5', 'prep-phase-3', 'prep-phase-final');
        if (timeLeft === 5) {
            timerDisplay.classList.add('prep-phase-5');
        } else if (timeLeft === 3) {
            timerDisplay.classList.remove('prep-phase-5');
            timerDisplay.classList.add('prep-phase-3');
        } else if (timeLeft === 1) {
            timerDisplay.classList.remove('prep-phase-3');
            timerDisplay.classList.add('prep-phase-final');
        }
    } else {
        timerDisplay.classList.remove('prep-phase-5', 'prep-phase-3', 'prep-phase-final');
        phase = isWorking ? 'ГРЕБЛЯ' : 'ОТДЫХ';
        
        // Add work/rest phase classes
        timerDisplay.classList.remove('work-phase', 'work-phase-end', 'rest-phase', 'rest-phase-end');
        if (isWorking) {
            if (timeLeft > 3) {
                timerDisplay.classList.add('work-phase');
            } else {
                timerDisplay.classList.add('work-phase-end');
            }
        } else {
            if (timeLeft > 3) {
                timerDisplay.classList.add('rest-phase');
            } else {
                timerDisplay.classList.add('rest-phase-end');
            }
        }
        
        progress = isWorking ? 
            `Интервал ${currentRepeat + 1}/${repeats}` :
            `Отдых ${currentRepeat + 1}/${repeats}`;
    }
    timerDisplay.innerHTML = `
        <div style="color: ${isWorking ? '#2196F3' : '#4CAF50'}; font-size: 1.5rem;">${phase}</div>
        <div style="font-size: 3rem; margin: 10px 0;">${timeLeft}</div>
        <div style="color: #666; font-size: 1rem;">${progress}</div>
        <div class="progress-bar" style="width: ${(timeLeft / (isWorking ? workTime : restTime)) * 100}%"></div>
    `;

    // Play sounds for all phases when timeLeft is 5 or less than or equal to 3
    if (timeLeft === 5 || timeLeft <= 3) {
        sounds.prep.play();
    }
});