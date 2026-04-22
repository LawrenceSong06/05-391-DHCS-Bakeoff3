/**
 * @description
 * This is a query for a database.
 */
export class Query<T>{
    private filters : Array<(record : T) => boolean>;
    private orders : Array<(record1 : T, record2 : T) => boolean>;
    private from_table : string;
    private db : DB<T>;

    public constructor(db : DB<T>){
        this.filters = [];
        this.orders = [];
        this.db = db;
    }

    public from(table_name : string){
        this.from_table = table_name;
    }

    /**
     * @description A filtering for query. Only a record `r` is included in the query result only if `cond(r)==true`
     * @param cond A predicate that returns `true` when a record needs to be included in the result, and `false` otherwise
     */
    public where(cond : (record : T) => boolean){
        this.filters.push(cond);
        return this;
    }

    /**
     * @description A ordering for query. This will order the query result by a predicate is_before.
     * For any two records `(record1, record2)`, if `less_than(record1, record2) == true`, 
     * then `record1` comes before `record2` in the query result.
     * @param less_than A predicate that returns `true` when the first argument record 
     * should come before the second argument in the final result.
     */
    public order_by(less_than : (record1 : T, record2 : T) => boolean){
        this.orders.push(less_than);
        return this;
    }

    /**
     * @returns the result of the query
     */
    public get result(){
        if(!this.from_table){
            throw "QUERY ERROR: query must include a FROM term.";
        }

        // get the from table
        let res = this.db.get_table(this.from_table);
        
        // apply all filters
        this.filters.forEach(f => {
            res = res.filter(f);
        });

        // apply all orders
        this.orders.forEach(f => {
            res = res.sort((a, b)=>{
                return f(a,b) ? -1 : 1;
            });
        });

        return res;
    }
}

/**
 * @description
 * A simple "database" that stores all data needed. 
 * It has a flat structure (i.e. every table is just an array)
 */
export class DB<T>{
    private table : {[key : string] : Array<T>};

    public constructor(){
        this.table = {};
    }

    /**
     * @returns all records in the database
     */
    public get_table(table_name : string){
        return this.table[table_name];
    }

    /**
     * @description CREATE a new table in the database
     * @param table_name the name of the new table
     */
    public create(table_name : string){
        this.table[table_name] = [];
    }

    /**
     * @description Insert a record into the database, this will append `record` to a table
     * @param table the table to be inserted
     * @param record the record to be inserted
     */
    public insert(table : string, record : T){
        this.table[table].push(record);
    }

    /**
     * @description Inserting a list of records.
     * @param table the table to be inserted
     * @param records the list of records
     */
    public insert_all(table : string, records : Array<T>){
        records.forEach(r => {
            this.insert(table, r);
        });
    }

    /**
     * @description Querying the database
     * @param table the table to be queried
     * @returns a query object
     * 
     * @example
     * // Sample query
     * // This returns all records in table1
     * // Notice that the ".result" must be included to execute the query. 
     * // Otherwise, it will remain as the query object.
     * db.select_from("table1").result
     */
    public query(table : string){
        return new Query(this);
    }
}