const socket = io();

document.getElementById('intervalForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const workTime = parseInt(document.getElementById('workTime').value);
    const restTime = parseInt(document.getElementById('restTime').value);
    const repeats = parseInt(document.getElementById('repeats').value);

    // Отправляем данные на сервер
    socket.emit('startTimer', { workTime, restTime, repeats });
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

    const phase = isWorking ? 'ГРЕБЛЯ' : 'ОТДЫХ';
    const progress = isWorking ? 
        `Интервал ${currentRepeat + 1}/${repeats}` :
        `Отдых ${currentRepeat + 1}/${repeats}`;
    timerDisplay.innerHTML = `
        <div style="color: ${isWorking ? '#2196F3' : '#4CAF50'}; font-size: 1.5rem;">${phase}</div>
        <div style="font-size: 3rem; margin: 10px 0;">${timeLeft}</div>
        <div style="color: #666; font-size: 1rem;">${progress}</div>
    `;
});