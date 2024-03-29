/************************************************
 *           T O N Y ' S  S T U D I O           *
 * -------------------------------------------- *
 * Project Name: Metronome                      *
 *     Filename: copyright.js                   *
 *   Programmer: Tony Skywalker                 *
 *   Start Date: July 11, 2022                  *
 *  Last Update:                                *
 * -------------------------------------------- *
 * Overview:                                    *
 *   Just... a little surprise. :)              *
 ************************************************/

(function () {
    console.log(" ___________________________________ ");
    console.log("/    Welcome to Tony's Metronome!   \\");
    console.log("|           Version 2.0.0           |");
    console.log("\\ Developed by www.tonys-studio.top /");
    console.log(" ----------------------------------- ");
})();

(function () {
    let beginYear = 2022;
    let currentYear = new Date().getFullYear();

    document.getElementById("year").innerHTML = beginYear + (beginYear === currentYear ? "" : " - " + currentYear);
})();