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


export class appConfig {
    opc:opcConfig;
    sql:sqlConfig;
    items:Array<itemLink>;
    constructor() {
       this.opc = new opcConfig();
       this.sql = new sqlConfig();
       this.items = []; 
    }
}
export class opcConfig {
    url:string;
    constructor() {
        this.url = "";
    }
}
export class sqlConfig {
    user:string;
    password:string;
    url:string;
    port:number;
    database:string;
    table:string;
    resetTable:boolean;
    constructor() {
        this.url = "";
        this.table = "";
        this.resetTable = false;
    }
}
export class itemLink {
    opc:itemLinkOpc;
    sql:itemLinkSql;
    constructor() {
        this.opc = new itemLinkOpc();
        this.sql = new itemLinkSql();
    }
}
export class itemLinkOpc {
    path?:string;
    nodeId?:string;
    type:string;
    constructor() {
        this.type = "";
    }
}
export class itemLinkSql {
    name:string;
    type:string;
    constructor() {
        this.name = "";
        this.type = "";
    }
}