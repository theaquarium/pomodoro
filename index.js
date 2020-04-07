window.addEventListener('load', () => {
	let timer = 0;
	let current;
	let auto = false;
	let autoCounter = -1;
	let interval;

	const audioPlayer = document.createElement('audio');

	if (audioPlayer.canPlayType('audio/mpeg')) {
		audioPlayer.setAttribute('src','ding.mp3');
	}

	const resetTimers = () => {
		document.querySelectorAll('.active').forEach(el => {
			el.classList.remove('active');
		});
		document.querySelector('.ShortBreak').innerHTML = '05:00';
		document.querySelector('.LongBreak').innerHTML = '15:00';
		document.querySelector('.Pomodoro').innerHTML = '25:00';
		current = null;
		timer = 0;
	}

	const setupTimer = (time, target) => {
		resetTimers();
		target.classList.add('active');

		current = target;

		timer = time;
		clearInterval(interval);
		interval = setInterval(() => {
			updateTimer();
		}, 1000);

		addLog('Started ' + (time / 60) + ' Minute Timer');
		
		document.querySelector('.PauseBox').innerHTML = '<i class="fas fa-pause"></i>';
	}

	const addLog = message => {
		const now = new Date();
		const logItem = document.createElement('div');
		logItem.classList.add('LogItem');
		const time = document.createElement('span');
		const text = document.createElement('span');
		text.innerHTML = message;
		time.innerHTML = now.getHours() + ':' + now.getMinutes();
		logItem.appendChild(time);
		logItem.appendChild(text);
		document.querySelector('.Log').appendChild(logItem);
	}

	const updateTimer = () => {
		timer -= 1;
		const s = timer % 60;
		const m = (timer - s) / 60;
		const formatS = ('0' + s).slice(-2);
		const formatM = ('0' + m).slice(-2);
		current.innerHTML = formatM + ':' + formatS;
		if (timer === 0) {
			audioPlayer.currentTime = 0;
			audioPlayer.play();
			addLog('Completed Timer');
			if (auto) {
				clearInterval(interval);
				let nextDuration;
				let target;
				switch (autoCounter) {
					case 0:
					case 2:
					case 4:
						nextDuration = 300;
						target = document.querySelector('.ShortBreak');
						break;
					case -1:
					case 1:
					case 3:
					case 5:
						nextDuration = 1500;
						target = document.querySelector('.Pomodoro');
						break;
					case 7:
						nextDuration = 1500;
						target = document.querySelector('.Pomodoro');
						break;
					case 6:
						nextDuration = 900;
						target = document.querySelector('.LongBreak');
						break;
				};
				if (autoCounter === 7) {
					autoCounter = 0;
				} else {
					autoCounter++;
				}
				setupTimer(nextDuration, target);
			} else {
				pause();
				resetTimers();
			}
		}
	}

	const pause = () => {
		document.querySelector('.PauseBox').innerHTML = '<i class="fas fa-play"></i>';
		addLog('Paused');
		clearInterval(interval);
		interval = null;
	}

	const unpause = () => {
		document.querySelector('.PauseBox').innerHTML = '<i class="fas fa-pause"></i>';
		addLog('Resumed');
		interval = setInterval(() => {
			updateTimer();
		}, 1000);
	}

	document.querySelector('.Pomodoro').addEventListener('click', e => {
		auto = false;
		document.querySelector('.AutoMode').innerHTML = 'Auto Mode Off';
		setupTimer(1500, e.target);
	});

	document.querySelector('.ShortBreak').addEventListener('click', e => {
		auto = false;
		document.querySelector('.AutoMode').innerHTML = 'Auto Mode Off';
		setupTimer(300, e.target);
	});

	document.querySelector('.LongBreak').addEventListener('click', e => {
		auto = false;
		document.querySelector('.AutoMode').innerHTML = 'Auto Mode Off';
		setupTimer(900, e.target);
	});

	document.querySelector('.PauseBox').addEventListener('click', e => {
		if (interval) {
			pause();
		} else {
			if (!current) {
				setupTimer(1500, document.querySelector('.Pomodoro'));
				auto = true;
				autoCounter = 0;
				document.querySelector('.AutoMode').innerHTML = 'Auto Mode On';
			} else {
				unpause();
			}
		}
	});

	window.addEventListener('keypress', e => {
		if (e.which === 32) {
			if (interval) {
				pause();
			} else {
				if (!current) {
					setupTimer(1500, document.querySelector('.Pomodoro'));
					auto = true;
					autoCounter = 0;
					document.querySelector('.AutoMode').innerHTML = 'Auto Mode On';
				} else {
					unpause();
				}
			}
		}
	});

	document.querySelector('.AutoMode').addEventListener('click', e => {
		if (auto) {
			auto = false;
			e.target.innerHTML = 'Auto Mode Off';
		} else {
			auto = true;
			autoCounter = -1;
			e.target.innerHTML = 'Auto Mode On';
		}
	});

	document.querySelector('.ModalClose').addEventListener('click', () => {
		document.querySelector('.Modal').classList.add('is-inactive');
	});

	document.querySelector('.ModalBack').addEventListener('click', () => {
		document.querySelector('.Modal').classList.add('is-inactive');
	});

	document.querySelector('.Info').addEventListener('click', () => {
		document.querySelector('.Modal').classList.remove('is-inactive');
	});
});