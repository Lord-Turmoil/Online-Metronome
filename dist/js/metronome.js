/************************************************
 *           T O N Y ' S  S T U D I O           *
 * -------------------------------------------- *
 * Project Name: Metronome                      *
 *     Filename: metronome.js                   *
 *   Programmer: Tony Skywalker                 *
 *   Start Date: July 11, 2022                  *
 *  Last Update: February 26, 2023              *
 * -------------------------------------------- *
 * Overview:                                    *
 *   Logic of metronome.                        *
 ************************************************/

let state = Metronome.load();

// bpm
var bpmInput = document.getElementById("bpm");
var bpmButtonList = document.getElementById("bpm-ctrl").getElementsByTagName("button");
const MIN_BPM = 1;
const MAX_BPM = 240;
const DEFAULT_BPM = 60;
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
var curBeat;

// notes (in one beat)
var notes;
var curNote;

// play button
var playButton = document.getElementById("play");
var isPlaying = false;

// audio oscillator
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var volume = audioCtx.createGain();
const TICK_FREQ = 1600;
const TOK_FREQ = 800;
const TAK_FREQ = 600;

const WAVEFORM = [
    "square",
    "sawtooth",
    "sine",
    "triangle"
]
var waveList = [];

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
var pattern = [];
var subDelay;   // current delay of subdivision in one beat
var subSize;    // how many notes (including silence) in the subdivision

// Metronome clock interval.
var intervalID;


function debug() {
    console.log("bpm = " + state.bpm);
    console.log("delay = " + delay);
    console.log("beats = " + state.beats);
    console.log("sub = " + state.subdivision);
    console.log("sub.size = " + subSize);
}

function updateDelay() {
    delay = 60000.0 / (state.bpm * notes);
}


/******************** BPM ********************/
function changeBPM(b) {
    let bpm = b;
    if (bpm < MIN_BPM) {
        bpm = MIN_BPM;
    } else if (bpm > MAX_BPM) {
        bpm = MAX_BPM;
    }
    state.bpm = bpm;
    bpmInput.value = bpm;

    updateDelay();
    resetState();

    state.save();
}

function addBPM(b) {
    changeBPM(state.bpm + b)
}


/******************** Beats ********************/
function changeBeats(b) {
    let beats = b;
    if (beats < MIN_BEATS) {
        beats = MIN_BEATS;
    } else if (beats > MAX_BEATS) {
        beats = MAX_BEATS;
    }

    state.beats = beats;
    beatsInput.value = beats;
    curNote = 0;

    initDot(beats);

    state.save();
}

function addBeats(b) {
    changeBeats(state.beats + b);
}


/******************** Subdivision ********************/
// Deprecated.
function setSubdivision(sub) {
    subList[sub].classList.add("active");
    state.subdivision = sub;
    pattern = SUBDIVISION[sub];  // Array.
    notes = pattern.length;
    curNote = 0;

    updateDelay();
    resetState();

    state.save();
}

function changeSubdivision(sub) {
    if (sub == state.subdivision) {
        return;
    }

    subList[state.subdivision].classList.remove("active");

    setSubdivision(sub);
}


/******************** Dot ********************/
function activateDot(d) {
    dotList.getElementsByTagName("li")[d].classList.add("active");
}

function deactivateDot(d) {
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
        deactivateDot(i);
    }
}

/******************** Play Metronome ********************/
// Reference:
// https://online-metronome.org/
function playNote(freq) {
    var oscillator = audioCtx.createOscillator();
    oscillator.connect(volume);
    volume.connect(audioCtx.destination);

    oscillator.type = WAVEFORM[state.soundStyle];

    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.04);
}

function playBeat() {
    if (curNote == 0) {
        if (curBeat == 0) {
            if (state.beats > 1) {
                deactivateDot(state.beats - 1);
            }
        } else {
            deactivateDot(curBeat - 1);
        }
        activateDot(curBeat);
    }

    if (pattern[curNote] == 1) {
        if (curNote == 0 && curBeat == 0) {
            playNote(state.stressFirst ? TICK_FREQ : TOK_FREQ);
        }
        else {
            playNote(curNote == 0 ? TOK_FREQ : TAK_FREQ);
        }
    }

    if (++curNote >= notes) {
        curNote = 0;
        if (++curBeat >= state.beats) {
            curBeat = 0;
        }
    }
}

function playMetronome() {
    playButton.innerHTML = "Stop";
    playButton.className = "play";
    curBeat = 0;
    playBeat(); // It may be unstable.
    intervalID = setInterval(playBeat, delay);

    // debug();
}

function stopMetronome() {
    playButton.innerHTML = "Play";
    playButton.className = "stop";

    clearInterval(intervalID);

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
    changeBPM(state.bpm);

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
    changeBeats(state.beats);

    beatsButtonList[0].onclick = function () {
        addBeats(-1);
    }
    beatsButtonList[1].onclick = function () {
        addBeats(1);
    }
    beatsInput.onchange = function () {
        if (beatsInput.value == "") {
            changeBeats(state.beats);
        } else {
            changeBeats(parseInt(beatsInput.value));
        }
    }

    if (state.stressFirst) {
        stressButton.innerHTML = "Yes";
        stressButton.className = "yes"
    } else {
        stressButton.innerHTML = "No";
        stressButton.className = "no";
    }

    stressButton.onclick = function () {
        state.stressFirst = !state.stressFirst;
        if (state.stressFirst) {
            stressButton.innerHTML = "Yes";
            stressButton.className = "yes"
        } else {
            stressButton.innerHTML = "No";
            stressButton.className = "no";
        }
        state.save();
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

    setSubdivision(state.subdivision);

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


/******************** Waveform ********************/
function setWaveform(id) {
    state.soundStyle = id;
    waveList[id].classList.add("active");
}

function changeWaveform(id) {
    if (state.soundStyle == id) {
        return;
    }

    waveList[state.soundStyle].classList.remove("active");
    setWaveform(id);

    state.save();
}

function initWaveform() {
    waveList = document.getElementById("wave-list").getElementsByTagName("li");
    setWaveform(state.soundStyle);
    for (var i = 0; i < waveList.length; i++) {
        (function (_i) {
            waveList[_i].onclick = function () {
                changeWaveform(_i);
            };
        })(i);
    }
}


/******************** Start ! ********************/
(function init() {
    initSubdivision();
    initBMP();
    initBeats();
    initPlay();
    initWaveform();
})();

// enable no sleep
var noSleep = new NoSleep();
document.addEventListener('click', function enableNoSleep() {
    document.removeEventListener('click', enableNoSleep, false);
    noSleep.enable();
}, false);
