/************************************************
 *           T O N Y ' S  S T U D I O           *
 * -------------------------------------------- *
 * Project Name: Metronome                      *
 *     Filename: metronome.js                   *
 *   Programmer: Tony Skywalker                 *
 *   Start Date: July 11, 2022                  *
 *  Last Update: October 11, 2022               *
 * -------------------------------------------- *
 * Overview:                                    *
 *   Logic of metronome.                        *
 ************************************************/

// bpm
var bpmInput = document.getElementById("bpm");
var bpmButtonList = document.getElementById("bpm-ctrl").getElementsByTagName("button");
const MIN_BPM = 1;
const MAX_BPM = 240;
const DEFAULT_BPM = 60;
var bpm;
var delay;

// dots
var dotList = document.getElementById("dot-list");

// beats
var beatsInput = document.getElementById("beats");
var beatsButtonList = document.getElementById("beats-ctrl").getElementsByTagName("button");
var stressButton = document.getElementById("stress");
const MIN_BEATS = 1;
const MAX_BEATS = 8;
const DEFAULT_BEATS = 4;
var beats;
var curBeat;
var stressFirst;

// play button
var playButton = document.getElementById("play");
var isPlaying = false;

// audio oscillator
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var volume = audioCtx.createGain();
var waveform = "square";
const TICK_FREQ = 1600;
const TOK_FREQ = 800;
const TAG_FREQ = 600;

// subdivisions
const SUBDIVISION = [
    [1],            // 4
    [1, 1],         // 8-8
    [1, 0, 1, 1],   // 8-16-16
    [1, 1, 1, 0],   // 16-16-8
    [1, 1, 1, 1],   // 16-16-16-16
    [1, 1, 1],      // triplet-8
    [1, 0, 0, 1],   // 8dot-16
    [1, 1, 0, 0],   // 16-8dot
];
var subList = [];    // subdivision list
var curSub;     // current subdivision id
var subDelay;   // current delay of subdivision in one beat
var subSize;    // how many notes (including silence) in the subdivision

// Two id for interval.
var intervalID;
var timeoutID = [];

function debug() {
    console.log("bpm = " + bpm);
    console.log("delay = " + delay);
    console.log("beats = " + beats);
    console.log("sub = " + curSub);
    console.log("sub.size = " + subSize);
}


/******************** BPM ********************/
function changeBPM(b) {
    bpm = b;
    if (bpm < MIN_BPM) {
        bpm = MIN_BPM;
    } else if (bpm > MAX_BPM) {
        if (bpm == 628) {
            waveform = "sawtooth";
            console.log("Sawtooth");
        } else if (bpm == 1203) {
            waveform = "sine";
            console.log("Sine");
        }
        bpm = MAX_BPM;
    }

    delay = 60000.0 / bpm;

    bpmInput.value = bpm;

    resetState();
}

function addBPM(b) {
    changeBPM(bpm + b)
}


/******************** Beats ********************/
function changeBeats(b) {
    beats = b;
    if (beats < MIN_BEATS) {
        beats = MIN_BEATS;
    } else if (beats > MAX_BEATS) {
        beats = MAX_BEATS;
    }

    initDot(beats);
    curBeat = 0;

    beatsInput.value = beats;
}

function addBeats(b) {
    changeBeats(beats + b);
}


/******************** Subdivision ********************/
// Deprecated.
function setSubdivision(sub) {
    subList[sub].classList.add("active");
    curSub = sub;

    pattern = SUBDIVISION[curSub];  // Array.
    subSize = pattern.length;
    subDelay = delay / pattern.length;
}

function changeSubdivision(sub) {
    if (sub == curSub) {
        return;
    }

    subList[curSub].classList.remove("active");
    subList[sub].classList.add("active");
    curSub = sub;

    pattern = SUBDIVISION[curSub];  // Array.
    subSize = pattern.length;
    subDelay = delay / pattern.length;

    resetState();
}

/******************** Dot ********************/
function activeDot(d) {
    dotList.getElementsByTagName("li")[d].classList.add("active");
}

function deactiveDot(d) {
    dotList.getElementsByTagName("li")[d].classList.remove("active");
}

function initDot(n) {
    dotList.innerHTML = "";

    for (var i = 0; i < n; i++) {
        var dot = document.createElement("li");
        dot.className = "dot";
        dotList.appendChild(dot);
    }
}

function resetDot() {
    var list = dotList.getElementsByTagName("li");
    for (var i = 0; i < list.length; i++) {
        deactiveDot(i);
    }
}

/******************** Play Metronome ********************/
// Reference:
// https://online-metronome.org/
function playNote(freq) {
    var oscillator = audioCtx.createOscillator();
    oscillator.connect(volume);
    volume.connect(audioCtx.destination);

    oscillator.type = waveform;

    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.04);
}

function playBeat() {
    if (curBeat >= beats) {
        curBeat = 0;
    }

    activeDot(curBeat);
    if (SUBDIVISION[curSub][0] == 1) {
        if (curBeat == 0) {
            playNote(stressFirst ? TICK_FREQ : TOK_FREQ);
            if (beats > 1)
                deactiveDot(beats - 1);
        }
        else {
            playNote(TOK_FREQ);
            deactiveDot(curBeat - 1);
        }
    }

    timeoutID.length = 0;
    for (var i = 1; i < subSize; i++) {
        if (SUBDIVISION[curSub][i] == 1) {
            timeoutID.push(setTimeout(playNote, subDelay * i, TAG_FREQ));
        }
    }

    curBeat++;
}

function playMetronome() {
    playButton.innerHTML = "Stop";
    playButton.className = "play";
    curBeat = curNote = 0;
    playBeat();
    intervalID = setInterval(playBeat, delay);

    // debug();
}

function stopMetronome() {
    playButton.innerHTML = "Play";
    playButton.className = "stop";

    clearInterval(intervalID);
    for (var i = 0; i < timeoutID.length; i++) {
        clearInterval(timeoutID[i]);
    }
    timeoutID.length = 0;

    resetDot();
}


/******************** Play State ********************/
function changeState(state) {
    isPlaying = state;
    if (state) {
        playMetronome();
    } else {
        stopMetronome();
    }
}

function resetState() {
    if (isPlaying) {
        stopMetronome();
        playMetronome();
    }
}


/******************** Initialization ********************/
function initBMP() {
    changeBPM(DEFAULT_BPM);

    bpmButtonList[0].onclick = function () {
        addBPM(-5);
    };
    bpmButtonList[1].onclick = function () {
        addBPM(-1);
    };
    bpmButtonList[2].onclick = function () {
        addBPM(1);
    };
    bpmButtonList[3].onclick = function () {
        addBPM(5);
    };
    bpmInput.onchange = function () {
        if (bpmInput.value == "") {
            changeBPM(bpm);
        } else {
            changeBPM(parseInt(bpmInput.value));
        }
    }
}

function initBeats() {
    changeBeats(DEFAULT_BEATS);
    stressFirst = true;

    beatsButtonList[0].onclick = function () {
        addBeats(-1);
    }
    beatsButtonList[1].onclick = function () {
        addBeats(1);
    }
    beatsInput.onchange = function () {
        if (beatsInput.value == "") {
            changeBeats(beats);
        } else {
            changeBeats(parseInt(beatsInput.value));
        }
    }
    stressButton.onclick = function () {
        stressFirst = !stressFirst;
        if (stressFirst) {
            stressButton.innerHTML = "Yes";
            stressButton.className = "yes"
        } else {
            stressButton.innerHTML = "No";
            stressButton.className = "no";
        }
    }
}

function initSubdivision() {
    var subRow = document.getElementById("sub-box").getElementsByClassName("sub-row");

    for (var i = 0; i < subRow.length; i++) {
        var row = subRow[i].getElementsByClassName("sub-item");
        for (var j = 0; j < row.length; j++) {
            subList.push(row[j]);
        }
    }

    setSubdivision(0);

    for (var i = 0; i < subList.length; i++) {
        (function (_i) {
            subList[_i].onclick = function () {
                changeSubdivision(_i);
            };
        })(i);
    }
}

function initPlay() {
    playButton.onclick = function () {
        changeState(!isPlaying);
    }

    changeState(false)
}

/******************** Start ! ********************/
(function init() {
    initBMP();
    initBeats();
    initSubdivision();
    initPlay();
})();
