// Borrowed this algorithm from 15-210...
// We will use this algorithm for searching the "most similar" matching result of actor's names 
/**
 * @description
 * This algorithm computes the fewest edits (insert/delete/replace) needed to change string from `s` to `p`.
 * This algorithm is implemented by dynamic programming.
 */
export function string_difference(S : string, P : string){
    const s = S.split(" ").join().toLowerCase(); 
    const p = P.split(" ").join().toLowerCase();

    let n = s.length;
    let m = p.length;

    let MED = Array.from({ length: n+1}, () => Array(m+1).fill(0));
    for(let i = 0; i <= m; i++){
        MED[0][i] = i;
    }
    for(let i = 0; i <= n; i++){
        MED[i][0] = i;
    }
    
    for(let i = 1; i <= n; i++){
        for(let j = 1; j <= m; j++){
            MED[i][j] = Math.min(Math.min(
                // Case1, we replace s[i-1] with p[j-1]
                MED[i-1][j-1] + (s[i-1] != p[j-1] ? 1 : 0),
                // Case2, we delete s[i-1]
                MED[i-1][j] + 1),
                // Case3, we insert t[j-1] after s[i-1]
                MED[i][j-1] + 1 
            );
        }
    }

    return MED[n][m];
}