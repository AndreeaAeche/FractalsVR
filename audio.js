audioContext = new window.AudioContext();

function loadAudio(){
  source = audioContext.createBufferSource();
  analyser = audioContext.createAnalyser();
  freqByteData = new Uint8Array(analyser.frequencyBinCount);
  timeByteData = new Uint8Array(analyser.frequencyBinCount);

  analyser.smoothingTimeConstant = 0.01;
  analyser.fftSize = 32;

  	// Connect audio processing graph
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  loadAudioBuffer("sound/raid.wav");
}

function loadAudioBuffer(url) {

	// Load asynchronously
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "arraybuffer";

	request.onload = function() {

		audioContext.decodeAudioData(request.response, function(buffer) {
			audioBuffer = buffer;
			finishLoad();
		}, function(e) { console.log(e); });
	};
	request.send();
}

function finishLoad() {
	source.buffer = audioBuffer;
	source.loop = true;
	source.start(0.0);
}
