/*
 *   Copyright (c) 2022 Malte Hering
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import exp = require('constants');
import { DataValue } from 'node-opcua-client';
import { Client } from 'ts-postgres';
import { appConfig, itemLink } from './classes';

/*
 * the SQLDataType and SQLDataTypes are used to parse a selected type from the opcua datatype to sql datatype
 */
export class SQLDataType {
    name: string;
    sqlValue: number; // Value to Oder Columes in Database to get rid of colum offsets (less data in db)
    convertToSQL: any; // Function to parse
    constructor(name: string = "", sqlValue: number = 0, convertToSQL = (item: itemLink, val: DataValue): string => {
        return "'" + val.value.value.toString() + "'"
    }
    ) {
        this.name = name;
        this.sqlValue = sqlValue;
        this.convertToSQL = convertToSQL;
    }
}
// List of sql datatypes
export const SQLDataTypes: Array<SQLDataType> = [
    //gemoetric:Array<SQLDataType> = [
    new SQLDataType("box", 6),
    new SQLDataType("circle", 6),
    new SQLDataType("line", 6),
    new SQLDataType("lseg", 6),
    new SQLDataType("path", 6),
    new SQLDataType("point", 6),
    new SQLDataType("polygon", 6),
    //]
    //date:Array<SQLDataType> = [
    new SQLDataType("timestamp", 5, (item: itemLink, val: DataValue): string => {
        var date = (val.value.value as Date);
        return `'${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}'`;
    }),
    new SQLDataType("timetz", 5, (item: itemLink, val: DataValue): string => {
        var date = (val.value.value as Date);
        return `'${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}'`;
    }),
    new SQLDataType("timestamptz", 5, (item: itemLink, val: DataValue): string => {
        var date = (val.value.value as Date);
        return `'${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}'`;
    }),
    new SQLDataType("date", 5, (item: itemLink, val: DataValue): string => {
        var date = (val.value.value as Date);
        return `'${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}'`
    }),
    new SQLDataType("time", 5, (item: itemLink, val: DataValue): string => {
        var date = (val.value.value as Date);
        return `'${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}'`;
    }),
    new SQLDataType("interval", 5, (item: itemLink, val: DataValue): string => {
        var date = (val.value.value as Date);
        return `'${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}'`;
    }),
    //]
    //boolean:Array<SQLDataType> = [
    new SQLDataType("bool", 0),
    new SQLDataType("boolean", 0),
    //]

    //number:Array<SQLDataType> = [
    new SQLDataType("int", 4),
    new SQLDataType("int2", 4),
    new SQLDataType("int4", 4),
    new SQLDataType("int8", 4),
    new SQLDataType("integer", 4),
    new SQLDataType("smallint", 4),
    new SQLDataType("bigint", 4),

    new SQLDataType("serial", 4),
    new SQLDataType("serial2", 4),
    new SQLDataType("serial4", 4),
    new SQLDataType("serial8", 4),
    new SQLDataType("smallserial", 4),
    new SQLDataType("bigserial", 4),

    new SQLDataType("float4", 4),
    new SQLDataType("float8", 4),
    new SQLDataType("double precision", 4),
    new SQLDataType("decimal", 4),
    new SQLDataType("real", 4),
    new SQLDataType("money", 4),
    new SQLDataType("numeric", 4),

    new SQLDataType("pg_lsn", 4),
    //];
    //string:Array<SQLDataType> = [
    new SQLDataType("text", 7),
    new SQLDataType("bit", 7),
    new SQLDataType("bit varying", 7),
    new SQLDataType("bytea", 7),
    new SQLDataType("character", 7),
    new SQLDataType("character varying", 7),
    new SQLDataType("char", 7),
    new SQLDataType("varchar", 7),
    new SQLDataType("varbit", 7),
    new SQLDataType("tsquery", 7),
    new SQLDataType("tsvector", 7),
    new SQLDataType("txid_snapshot", 7),
    new SQLDataType("uuid", 7),
    new SQLDataType("xml", 7),
    new SQLDataType("cidr", 7),
    new SQLDataType("macaddr", 7),
    new SQLDataType("json", 7),
    new SQLDataType("jsonb", 7),
    new SQLDataType("inet", 7),
    //]
];

// A class with the item from config and values from opcua client
export class itemBuffer {
    item: itemLink;
    value: DataValue;
    constructor() {

    }
}
// a temporary storrage
var itemsBuffer: Array<itemBuffer> = [];
// a temporary storrage
var itemsBufferOld: Array<itemBuffer> = [];

export function connectToDb(config: appConfig) {
    return new Promise<Client>((resolve, reject) => {
        // Create a new Postgres SQL client with data from config
        var client = new Client({
            user: config.sql.user,
            password: config.sql.password,
            host: config.sql.url,
            database: config.sql.database,
            port: config.sql.port
        })
        // Connect to Database
        client.connect().then(() => {
            console.log("[db] Connected to postgres DB on %s:%d as %s and open %s db",
                config.sql.url,
                config.sql.port,
                config.sql.user,
                config.sql.database);
            resolve(client);
        }, (err) => {
            reject(err);
        });
    })
}
/**
 * Create a new table with columes from config
 * @param client the db client
 * @param config the config
 * @returns the changed config
 */
export function createTable(client: Client, config: appConfig) {
    return new Promise<appConfig>(async (resolve, reject) => {
        // Check if table reset is selected in config
        if (config.sql.resetTable) {
            // Delete old Table
            var drop = `DROP TABLE IF EXISTS ${config.sql.table}`;
            client.query(drop);
            // Create sql command to create new table
            var sql = "";
            var dateName = "dateTime";
            var dateType = "TIMESTAMP";
            sql += ` CREATE TABLE ${config.sql.table} ( ${dateName} ${dateType} NOT NULL DEFAULT CURRENT_TIMESTAMP, `;

            config.items.forEach((item, index, arr) => {
                if (item.sql.name && item.sql.type) {
                    sql += `${item.sql.name} ${item.sql.type}`;
                }
                if (index != arr.length - 1) {
                    sql += ", "
                }
            });
            sql += ")";
            // run sql command
            client.query(sql).then((value) => {
                
                console.group("[db] Created a new table %s with %d Colums", config.sql.table, config.items.length);
                console.log("[db] %d, %s: %s", 0, dateName, dateType);
                config.items.forEach((item, index, arr) => {

                    if (item.sql.name && item.sql.type) {
                        console.log("[db] %d, %s: %s", index + 1, item.sql.name, item.sql.type.toLocaleUpperCase());
                    }
                });
                console.groupEnd();
                // reset table resetting
                config.sql.resetTable = false;
                resolve(config);
            }, (err) => {
                console.log(err);
                reject(err);
            });
        }

        resolve(config);
    });
}
/**
 * add an entry to the database
 * @param client The db client
 * @param config The config
 * @param item Item from config
 * @param data Value from opcua monitoring "changed" event
 * @returns Success
 */
export function addEntry(client: Client, config: appConfig, item: itemLink, data: DataValue) {
    return new Promise<boolean>(async (resolve, reject) => {
        // check if item is in the buffer
        var findItem = itemsBuffer.find((value) => {
            return value.item == item;
        });
        if (findItem) {
            // When item is in itembuffer then first wrtie buffer to db then delete buffer and store new item in buffer
            writeItemsBuffer(client, config).then(() => {
                // Delete buffer and add new item
                var itembuf = new itemBuffer();
                itembuf.item = item;
                itembuf.value = data;
                itemsBuffer = [itembuf];

                resolve(true);
            }).catch((err) => {
                reject(err);
            });
            // Clear Buffer

        }
        else {
            // When item is not in itembuffer then add item to buffer
            var itembuf = new itemBuffer();
            itembuf.item = item;
            itembuf.value = data;
            itemsBuffer.push(itembuf);
            resolve(true);
        }
    });
}

/**
 * Wrtie buffer to Database
 * @param client the db client
 * @param config the config
 * @returns 
 */
export function writeItemsBuffer(client: Client, config: appConfig) {
    return new Promise<boolean>((resolve, reject) => {
        // create the sql command
        var sqlInsert = `INSERT INTO ${config.sql.table} (`;
        var sqlValues = `VALUES (`

        // check if new value is different to old value
        for (var a = 0; a < itemsBuffer.length; a++) {
            // get old item from buffer
            var itemnew = itemsBuffer[a];
            var oldItem = itemsBufferOld.find((oldItem) => {
                return itemnew.item == oldItem.item;
            });
            // check if old item exist
            if (oldItem) {
                // when old item exist check if value is different from new
                if (oldItem.value.value.value == itemnew.value.value.value) {
                    // when old and new value are equal remove item from buffer
                    itemsBuffer.splice(a, 1);
                }
            }
            else {
                // when old item not exist add new item to olb buffer
                itemsBufferOld.push(itemnew);
            }
        }
        // check if itemsBuffer contains items
        if (itemsBuffer.length == 0) {
            resolve(true);
            return;
        }
        // appand items to sql command
        itemsBuffer.forEach((item, index, arr) => {
            // find datatype of item
            var dataType: SQLDataType = SQLDataTypes.find(type => {
                return item.item.sql.type.toLocaleLowerCase().includes(type.name.toLocaleLowerCase())
            });
            // check if datatype exist
            if (dataType) {
                // add item name to sql command
                sqlInsert += item.item.sql.name;
                // pase item value to sql datatype and add to sql command
                sqlValues += dataType.convertToSQL(item.item, item.value)
                if (index != arr.length - 1) {
                    sqlInsert += ", ";
                    sqlValues += ", ";
                }
            }
        });
        sqlInsert += ") ";
        sqlValues += ") ";
        var sql = sqlInsert + sqlValues;
        // run sql command
        client.query(sql).then((value) => {
            resolve(true);
        }, (err) => {
            console.log(err);
            reject(err);
        });
    });
}
//INSERT INTO test (doublevalue) VALUES ('123.123123'); SELECT * FROM test;


//SELECT pg_size_pretty( pg_total_relation_size('test') );

/**
 * get the current Table Size
 * @param client the db client
 * @param config the config
 * @returns the table size as string with unit
 */
export function getTableSize(client: Client, config: appConfig) {
    return new Promise<string>((resolve, reject) => {
        var sql = `SELECT pg_size_pretty( pg_total_relation_size('${config.sql.table}') )`
        client.query(sql).then((value) => {
            resolve(value.rows[0][0] as string);
        }, (err) => {
            console.log(err);
            reject(err);
        });
    });
}