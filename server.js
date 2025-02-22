const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 4000;

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Новый пользователь подключился');
    let timerActive = false;

    socket.on('startTimer', (data) => {
        if (timerActive) {
            socket.emit('timerError', 'Таймер уже запущен');
            return;
        }
        timerActive = true;
        const { prepTime, workTime, restTime, repeats } = data;
        let currentRepeat = 0;
        let isWorking = true;
        let isPreparing = true;
        let timeLeft = prepTime;

        function updateTimer() {
            // Отправляем текущее состояние таймера всем клиентам
            io.emit('timerUpdate', {
                workTime,
                restTime,
                repeats,
                currentRepeat,
                isWorking,
                timeLeft,
                isPreparing
            });

            if (timeLeft > 0) {
                timeLeft--;
            } else {
                if (isPreparing) {
                    isPreparing = false;
                    isWorking = true;
                    timeLeft = workTime;
                } else if (isWorking) {
                    isWorking = false;
                    timeLeft = restTime;
                } else {
                    currentRepeat++;
                    if (currentRepeat < repeats) {
                        isWorking = true;
                        timeLeft = workTime;
                    } else {
                        io.emit('timerUpdate', {
                            workTime,
                            restTime,
                            repeats,
                            currentRepeat,
                            isWorking: false,
                            timeLeft: 0
                        });
                        timerActive = false;
                        return;
                    }
                }
            }

            setTimeout(updateTimer, 1000);
        }

        updateTimer();
    });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })