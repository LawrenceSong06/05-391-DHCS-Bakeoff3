// Time is just a number representing the minute in a day
export type Time = number;

export const Eternity = Infinity;
export const max = Math.max;
export const min = Math.min;

/**
 * @description Parse a string into a time object
 * @param hh_mm time in format of `hh:mm`
 * @returns a Time object
 */
export function parseTime(hh_mm : string, default_res = Eternity){
    if(!hh_mm){
        return default_res;
    }
    let t = hh_mm.split(":");
    let h = parseInt(t[0]);
    let m = parseInt(t[1]);
    return h*60 + m;
}

export function toString(t : Time){
    let h = (t / 60) % 24;
    h = Math.round(h);
    let m = t % 60;
    
    const hh = h < 10 ? `0${h}` : `${h}`;
    const mm = m < 10 ? `0${m}` : `${m}`;

    return `${hh}:${mm}`;
}