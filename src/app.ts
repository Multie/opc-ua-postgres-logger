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
import * as fs from "fs";

import { appConfig, itemLink } from './classes';

import { OpcConnect, OpcCreateLinks } from './opcua'

import { connectToDb, createTable, getTableSize  } from './database'


var configPath = "./config/itemLinkConfig.json";

/**
 * Load the application config
 * @returns Success of file read
 */
function loadConfig() {
    return new Promise<appConfig>((resolve, reject) => {
        // check if path exist
        if (!fs.existsSync(configPath)) {
            // create a new config
            var config = new appConfig();
            config.items.push(new itemLink());
            // wrtie default config to file
            fs.writeFile(configPath, JSON.stringify(config), null, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log("[app] Config not exist. Stored a new config to %s", configPath);
                reject(err);
            });
        }
        else {
            // read config from file
            fs.readFile(configPath,(err,data)=> {
                if (err) {
                    reject(err);
                    return;
                }
                 // parse text to config
                var config:appConfig = JSON.parse(data.toString("utf-8"));
                if (config) {
                    // return config
                    console.log("[app] Load config from %s", configPath);
                    resolve(config); 
                }
                else {
                    reject("[app] appConfig is null");
                }
            });
        }
    });
}
/**
 * Store the application config
 * @returns Success of file wrtie
 */
function storeConfig(config:appConfig) {
    return new Promise<boolean>((resolve, reject) => {
        // parse config to text and wrtie to file
        fs.writeFile(configPath,JSON.stringify(config),(err)=> {
            if (err) {
                console.trace(err);
                reject(err);
                return;
            }
            console.log("[app] Stored config to %s", configPath);
            resolve(true);
        });

    });
}


console.log("-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --");
console.log("[app] Start %s", new Date(Date.now()).toString());
// load config
loadConfig().then(async (config:appConfig) => {    
    //connect to db
    connectToDb(config).then((client)=> {
        // create new table if requested
        createTable(client,config).then(()=> {
            // store config
            storeConfig(config).then(()=> {
                // get the Table size at start
                getTableSize(client,config).then((size)=> {
                    console.log("[db] Database Size %s at %s",size, new Date(Date.now()).toString());
                });
                setInterval(()=> {
                    // get table size in a interval
                    getTableSize(client,config).then((size)=> {
                        console.log("[db] Database Size %s at %s",size, new Date(Date.now()).toString());
                    });
                },300000);

                // connect to opcua
                OpcConnect(config).then(opc=> {
                    // create link from opc to db
                    OpcCreateLinks(client,config,opc).then(()=> {
            
                    },(err)=> {
                    });
                },(err)=> {   
                });
            },(err)=> {
            });
        },(err)=> {
        });
    },(err)=> {
    });
   
    /*var client = await connectToDb(config);
    
    await createTable(client,config);
    await storeConfig(config);
    

    setInterval(()=> {
        getTableSize(client,config).then((size)=> {
            console.log("Database Size:%s",size);
        });
    },5000);
    
    
    OpcConnect(config).then(opc=> {
        OpcCreateLinks(client,config,opc).then(()=> {

        },(err)=> {

        });
    },(err)=> {
        
    });*/
});



/*
function connectToDb(config) {
    return new Promise((resolve,reject)=> {
        var client = new Client({
            user:"postgres",
            password:"root",
            host:"127.0.0.1",
            database:"db",
            port:5432
        })
        client.connect().then(()=> {
            resolve(client);
        },(err)=> {
            reject(err);
        });
    })
}

function createTable(client,config) {
    return new Promise(async (resolve,reject)=> {

        var sql = `DROP TABLE IF EXISTS ${config.table}; CREATE TABLE ${config.table} ( dateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `;
        config.items.forEach((item,index,arr) => {
            if (item.sql.name && item.sql.dataType) {
                sql += `${item.sql.name} ${item.sql.dataType}`;
            }
            if (index != arr.length-1) {
                sql += ","
            }
        });
        sql += ");";
        console.log(sql);
        await client.query(sql)
        resolve(1);
    });
}

connectToDb(AppConfig).then(async (client)=> {
    createTable(client,AppConfig).then(()=> {
        client.end()
    });

   
});




//const res = await client.query('SELECT $1::text as message', ['Hello world!'])
//console.log(res.rows[0].message) // Hello world!
*/


/*

[
    1. Wrtie to DB
    item1:null
    item2:null
    item3:null
    2. Empfangen
    item1:233
    item2:324
    item3:null
    3. item1: old item1 != null -> 1.

    

]



*/