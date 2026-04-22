/**
 * @description
 * This is a query for a database.
 */
export class Query {
    constructor(db) {
        this.filters = [];
        this.orders = [];
        this.db = db;
    }
    from(table_name) {
        this.from_table = table_name;
        return this;
    }
    /**
     * @description A filtering for query. Only a record `r` is included in the query result only if `cond(r)==true`
     * @param cond A predicate that returns `true` when a record needs to be included in the result, and `false` otherwise
     */
    where(cond) {
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
    order_by(less_than) {
        this.orders.push(less_than);
        return this;
    }
    /**
     * @returns the result of the query
     */
    get result() {
        if (!this.from_table) {
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
            res = res.sort((a, b) => {
                return f(a, b) ? -1 : 1;
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
export class DB {
    constructor() {
        this.table = {};
    }
    /**
     * @returns all records in the database
     */
    get_table(table_name) {
        return this.table[table_name];
    }
    /**
     * @description CREATE a new table in the database
     * @param table_name the name of the new table
     */
    create(table_name) {
        this.table[table_name] = [];
    }
    /**
     * @description Insert a record into the database, this will append `record` to a table
     * @param table the table to be inserted
     * @param record the record to be inserted
     */
    insert(table, record) {
        this.table[table].push(record);
    }
    /**
     * @description Inserting a list of records.
     * @param table the table to be inserted
     * @param records the list of records
     */
    insert_all(table, records) {
        records.forEach(r => {
            this.insert(table, r);
        });
    }
    /**
     * @description Querying the database
     * @returns a query object
     *
     * @example
     * // Sample query
     * // This returns all records in table1
     * // Notice that the ".result" must be included to execute the query.
     * // Otherwise, it will remain as the query object.
     * db.select_all().from("table1").result
     */
    select_all() {
        return new Query(this);
    }
}
