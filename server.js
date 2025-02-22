const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;

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
        const { workTime, restTime, repeats } = data;
        let currentRepeat = 0;
        let isWorking = true;
        let timeLeft = workTime;

        function updateTimer() {
            // Отправляем текущее состояние таймера всем клиентам
            io.emit('timerUpdate', {
                workTime,
                restTime,
                repeats,
                currentRepeat,
                isWorking,
                timeLeft
            });

            if (timeLeft > 0) {
                timeLeft--;
            } else {
                if (isWorking) {
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