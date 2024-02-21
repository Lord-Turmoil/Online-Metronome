/************************************************
 *           T O N Y ' S  S T U D I O           *
 * -------------------------------------------- *
 * Project Name: Metronome                      *
 *     Filename: status.js                      *
 *   Programmer: Tony Skywalker                 *
 *   Start Date: July 11, 2022                  *
 *  Last Update: February 21, 2024              *
 * -------------------------------------------- *
 * Overview:                                    *
 *   Status of metronome.                       *
 ************************************************/

let DEFAULT = {
    bpm: 60,
    beats: 4,
    subdivision: 0,
    stressFirst: true,
    soundStyle: 0
}

class Metronome {
    constructor(props) {
        this.bpm = props.bpm;
        this.beats = props.beats;
        this.subdivision = props.subdivision;
        this.stressFirst = props.stressFirst;
        this.soundStyle = props.soundStyle;
    }

    save() {
        localStorage.setItem("metronome", JSON.stringify(this));
    }

    static load() {
        if (localStorage.getItem("metronome") === null) {
            return new Metronome(DEFAULT);
        }

        let state = JSON.parse(localStorage.getItem("metronome"));

        return new Metronome(state);
    }
}