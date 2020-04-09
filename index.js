window.addEventListener('load', () => {
	const timerCircles = {
		300: document.querySelector('.ShortBreak'),
		900: document.querySelector('.LongBreak'),
		1500: document.querySelector('.Pomodoro'),
	};

	let timer = 0;
	let current;
	let auto = false;
	let autoCounter = -1;
	let interval;

	let blockConnect = false;

	let websocket = null;

	const audioPlayer = document.createElement('audio');

	if (audioPlayer.canPlayType('audio/mpeg')) {
		audioPlayer.setAttribute('src','ding.mp3');
	}

	const urlParams = new URLSearchParams(window.location.search);
	const wsUrl = urlParams.get('s');
	if (wsUrl) {
		document.querySelector('.ServerInfoInput').value = decodeURI(wsUrl);
	}
	
	const resetTimers = () => {
		document.querySelectorAll('.active').forEach(el => {
			el.classList.remove('active');
		});
		timerCircles[300].innerHTML = '05:00';
		timerCircles[900].innerHTML = '15:00';
		timerCircles[1500].innerHTML = '25:00';
		current = null;
		timer = 0;
	};

	const setupTimer = time => {
		resetTimers();
		timerCircles[time].classList.add('active');
		current = time;

		timer = time;
		clearInterval(interval);
		interval = setInterval(() => {
			updateTimer();
		}, 1000);

		// addLog('Started ' + (time / 60) + ' Minute Timer');
		
		document.querySelector('.PauseBox').innerHTML = '<i class="fas fa-pause"></i>';
	}

	const startInProgress = (newTimer, newCurrent, newAuto, newAutoCounter, paused) => {
		pause();
		resetTimers();

		timer = newTimer;
		current = newCurrent;
		auto = newAuto;
		autoCounter = newAutoCounter;

		timerCircles[current].classList.add('active');

		const s = timer % 60;
		const m = (timer - s) / 60;
		const formatS = ('0' + s).slice(-2);
		const formatM = ('0' + m).slice(-2);
		timerCircles[current].innerHTML = formatM + ':' + formatS;

		if (paused) {
			unpause();
		}
		if (auto) {
			document.querySelector('.AutoMode').innerHTML = 'Auto Mode On';
		} else {
			document.querySelector('.AutoMode').innerHTML = 'Auto Mode Off';
		}
	}

	/* const addLog = message => {
		const now = new Date();
		const logItem = document.createElement('div');
		logItem.classList.add('LogItem');
		const time = document.createElement('span');
		const text = document.createElement('span');
		text.innerHTML = message;
		time.innerHTML = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
		logItem.appendChild(time);
		logItem.appendChild(text);
		document.querySelector('.Log').appendChild(logItem);
	} */

	const updateTimer = () => {
		timer -= 1;
		const s = timer % 60;
		const m = (timer - s) / 60;
		const formatS = ('0' + s).slice(-2);
		const formatM = ('0' + m).slice(-2);
		timerCircles[current].innerHTML = formatM + ':' + formatS;
		if (timer === 0) {
			audioPlayer.currentTime = 0;
			audioPlayer.play();
			// addLog('Completed Timer');
			if (auto && !websocket) {
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
						break;
					case 7:
						nextDuration = 1500;
						break;
					case 6:
						nextDuration = 900;
						break;
				};
				if (autoCounter === 7) {
					autoCounter = 0;
				} else {
					autoCounter++;
				}
				setupTimer(nextDuration);
			} else {
				pause();
				resetTimers();
			}
		}
	}

	const pause = () => {
		if (interval) {
			document.querySelector('.PauseBox').innerHTML = '<i class="fas fa-play"></i>';
			// addLog('Paused');
			clearInterval(interval);
			interval = null;
		}
	}

	const unpause = () => {
		if (!interval) {
			document.querySelector('.PauseBox').innerHTML = '<i class="fas fa-pause"></i>';
			// addLog('Resumed');
			interval = setInterval(() => {
				updateTimer();
			}, 1000);
		}
	}

	const enableAuto = startAtPomodoro => {
		auto = true;
		// addLog('Auto Mode Turned On');
		autoCounter = startAtPomodoro ? 0 : -1;
		document.querySelector('.AutoMode').innerHTML = 'Auto Mode On';
	}

	const disableAuto = () => {
		auto = false;
		// addLog('Auto Mode Turned Off');
		document.querySelector('.AutoMode').innerHTML = 'Auto Mode Off';
	}

	const sendWSMessage = data => {
		websocket.send(JSON.stringify(data));
		console.log('Sending...');
	}

	const color = (newColor, element) => {
		element.classList.remove('Yellow');
		element.classList.remove('Red');
		element.classList.remove('Green');
		if (newColor) element.classList.add(newColor);
	}

	const makeQR = () => {
		document.querySelector('.QRCode').innerHTML = '';
		let minUnit = Math.min(window.innerHeight, window.innerWidth);
		let qrCode = new QRCode(document.querySelector('.QRCode'), {
			width: Math.max(250, 0.35*minUnit),
			height: Math.max(250, 0.35*minUnit),
			colorDark : "#222222",
			colorLight : "#eeeeee",
			correctLevel : QRCode.CorrectLevel.H
		});
		qrCode.makeCode(window.location.toString());
	}

	document.querySelector('.Pomodoro').addEventListener('click', e => {
		disableAuto();
		if (websocket) {
			sendWSMessage({ type: 'autoMode', data: { autoMode: false } });
			sendWSMessage({ type: 'startTimer', data: { timer: 1500 } });
		}
		setupTimer(1500);
	});

	document.querySelector('.ShortBreak').addEventListener('click', e => {
		disableAuto();
		if (websocket) {
			sendWSMessage({ type: 'autoMode', data: { autoMode: false } });
			sendWSMessage({ type: 'startTimer', data: { timer: 300 } });
		}
		setupTimer(300);
	});

	document.querySelector('.LongBreak').addEventListener('click', e => {
		disableAuto();
		if (websocket) {
			sendWSMessage({ type: 'autoMode', data: { autoMode: false } });
			sendWSMessage({ type: 'startTimer', data: { timer: 900 } });
		}
		setupTimer(900);
	});

	document.querySelector('.PauseBox').addEventListener('click', e => {
		if (interval) {
			pause();
			sendWSMessage({ type: 'pause' });
		} else {
			if (!current) {
				setupTimer(1500);
				enableAuto(true);
				document.querySelector('.AutoMode').innerHTML = 'Auto Mode On';
				if (websocket) {
					sendWSMessage({ type: 'autoMode', data: { autoMode: true } });
					sendWSMessage({ type: 'startTimer', data: { timer: 1500 } });
				}
			} else {
				unpause();
				if (websocket) {
					sendWSMessage({ type: 'resume' });
				}
			}
		}
	});

	window.addEventListener('keypress', e => {
		if (e.which === 32) {
			if (interval) {
				pause();
				if (websocket) {
					sendWSMessage({ type: 'pause' });
				}
			} else {
				if (!current) {
					setupTimer(1500);
					enableAuto(true);
					document.querySelector('.AutoMode').innerHTML = 'Auto Mode On';
					if (websocket) {
						sendWSMessage({ type: 'autoMode', data: { autoMode: true } });
						sendWSMessage({ type: 'startTimer', data: { timer: 1500 } });
					}
				} else {
					unpause();
					if (websocket) {
						sendWSMessage({ type: 'resume' });
					}
				}
			}
		}
	});

	document.querySelector('.AutoMode').addEventListener('click', e => {
		if (!auto) {
			if (current === 1500) {
				enableAuto(true);
			} else {
				enableAuto(false);
			}
			if (websocket) {
				sendWSMessage({ type: 'autoMode', data: { autoMode: true } });
			}
		} else {
			disableAuto();
			if (websocket) {
				sendWSMessage({ type: 'autoMode', data: { autoMode: false } });
			}
		}
	});

	document.querySelector('.ModalClose').addEventListener('click', () => {
		if (!blockConnect) {
			const clientInfo = document.querySelector('.ClientInfo');
			const status = document.querySelector('.ServerInfoStatus');
			const url = document.querySelector('.ServerInfoInput').value.trim();
			if (url) {
				blockConnect = true;
				status.innerHTML = 'Connecting...';
				color('Yellow', status);

				try {
					websocket = new WebSocket(url);
					websocket.onopen = event => {
						blockConnect = false;
						color('Green', status);
						status.innerHTML = 'Connected.';
						clientInfo.innerHTML = 'Connected to Server';
						color('Green', clientInfo);
						urlParams.set('s', encodeURI(url));
						window.history.replaceState({}, '', '?' + urlParams.toString());
						makeQR();
						document.querySelector('.QRBox').classList.remove('is-hidden');
						setTimeout(() => {
							document.querySelector('.Modal').classList.add('is-inactive');
						}, 500);
					};
	
					websocket.onclose = event => {
						if (!event.wasClean) {
							console.log('Connection Failed:', event);
							blockConnect = false;
							color('Red', status);
							status.innerHTML = 'Connection Failed: ' + event.reason;
							color('Red', clientInfo);
							clientInfo.innerHTML = 'Connection Error';
						}
						document.querySelector('.QRBox').classList.add('is-hidden');
					};

					websocket.onmessage = event => {
						console.log('Message Recieved');
						const jsonData = JSON.parse(event.data);
						const type = jsonData.type;
						const data = jsonData.data;
						switch (type) {
							case 'pause':
								pause();
								break;
							case 'resume':
								unpause();
								break;
							case 'autoMode':
								if (data) {
									if (data.autoMode) {
										if (current === 1500) {
											enableAuto(true);
										} else {
											enableAuto(false);
										}
									} else {
										disableAuto();
									}
								}
								break;
							case 'startTimer':
								if (data) {
									setupTimer(data.timer);
								}
								break;
							case 'startInProgress':
								if (data) {
									startInProgress(data.timer, data.current, data.auto, data.autoCounter, data.paused);
								}
								break;
							case 'resetTimers':
								resetTimers();
								break;
						}
					}
				} catch (e) {
					console.log('Websocket Create Failed:', e);
					blockConnect = false;
					color('Red', status);
					status.innerHTML = 'Connection Failed: ' + e.message;
				}
			} else {
				if (websocket) {
					websocket.close();
				}
				websocket = null;
				clientInfo.innerHTML = '';
				color('', clientInfo);
				status.innerHTML = '';
				color('', status);
				document.querySelector('.Modal').classList.add('is-inactive');
			}
		}
	});

	document.querySelector('.ResetTimer').addEventListener('click', () => {
		pause();
		resetTimers();
		if (websocket) {
			sendWSMessage({ type: 'pause' });
			sendWSMessage({ type: 'resetTimers' });
		}
	});

	document.querySelector('.ModalBack').addEventListener('click', () => {
		document.querySelector('.Modal').classList.add('is-inactive');
	});

	document.querySelector('.Info').addEventListener('click', () => {
		document.querySelector('.Modal').classList.remove('is-inactive');
	});

	window.addEventListener('resize', makeQR);
});