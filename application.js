var startTime = null;
var total = 0;
var analyserNode = null;
var threshold = 20000;
var max = 100000
var running = false;
var paused = true;

function format(time) {
    var milis   = Math.floor((time % 1000) / 10);
    var sec_num = Math.floor(time/1000);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    if (milis   < 10) {milis   = "0"+milis;}
    var result = hours+':'+minutes+':'+seconds+'.'+milis;
    return result;
}

// Return the current time (e.g. stopwatch time)
function getTime() {
    // If this hasn't run yet or has been paused, update the start time
    if (!startTime || paused) {
	var startDate = new Date();
	startTime = startDate.getTime();
    }

    // Do time math
    var d = new Date();
    var current = d.getTime() - startTime + total;

    return current;
}

// Draw the clock and volume bar
function update(time) {
    // Get frequency data and sum it for total volume
    var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(freqByteData);
    var volume = 0;
    for (var i=0; i<freqByteData.length; i++) { 
    	volume += freqByteData[i];
    }

    // TODO: Don't need to run this every time
    var c = $("#vol")[0]
    var volContext = c.getContext("2d");

    // Draw the volume
    volContext.clearRect(0, 0, c.width, c.height);
    volContext.fillStyle = "#FF4500";
    volContext.fillRect(0, 0, (volume/max)*c.width, c.height);
    
    // Draw the threshold line at 2px thick
    volContext.fillStyle = "black";
    volContext.fillRect((threshold/max)*c.width, 0, 2, c.height);

    // Update the clock if we're currently running and volume >= threshold
    if (volume >= threshold && running) {
	$("#clock").text(format(getTime()));
	paused = false;
    } else if (volume < threshold && !paused) {
	total = getTime();
	paused = true;
    }

    // Required to keep animating
    window.requestAnimationFrame(update);
}

// Reset the clock and stop timing
function reset() {
    running = false;
    paused = true;
    $("#clock").text("00:00:00.00");
    total = 0;
}

// Start timing
function start() {
    running = true;
}

// Stop timing but don't reset time
function stop() {
    total = getTime();
    running = false;
    paused = true;
}

// Hook up everything for getting audio data
// TODO: Check if everything is necessary
var onSuccess = function(s) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    var mediaStreamSource = context.createMediaStreamSource(s);

    // This is probably required
    inputPoint = context.createGain();
    realAudioInput = context.createMediaStreamSource(s);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

    analyserNode = context.createAnalyser();
    inputPoint.connect(analyserNode);

    // Start our animation
    window.requestAnimationFrame(update);
};

// Couldn't access audio
var onFail = function(e) {
    consoe.log('Rejected!', e);
    alert("Audio was not connected");
};

$(document).ready(function() {
    $("#startButton").click(function() {
	start();
    });
    $("#stopButton").click(function() {
	stop();
    });
    $("#resetButton").click(function() {
	reset();
    });
    $("#vol").click(function(e) {
	var c = $("#vol")[0]
	threshold = (e.offsetX / c.width) * max;
    });

    navigator.getUserMedia  = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    navigator.getUserMedia({audio: true}, onSuccess, onFail);
});