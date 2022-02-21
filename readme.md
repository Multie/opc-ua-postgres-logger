# OPC-UA Logger

This tool can read data from a OPC-UA server and store it to Postgres SQL database.



## Installation
Install [Postgres SQL database](https://www.postgresql.org/)  
Install [nodejs](https://nodejs.org/)  

### Tool installation
1. Clone Repo :  
`$ git clone`
2. Install Packges   
`$ npm install`
3. Compile Typescript  
`$ tsc -p ./tsconfig.json`
4. Run Javascript  
`$ node out/app.js`
5. (optional) Run application with nodemon  
`$ tsc -p ./tsconfig.json --watch`  
`$ nodemon --ignore ./config out/app.js`

## Configuration
the config is in ./config/itemLinkConfig.json

the config consists of three different parts. 

### The first part is the opc config. It contains the url to the Opc-Ua server.
````json
"opc": {
    "url": "opc.tcp://serverip:26543"
},    
````
### The second part is the sql config.
| Key           | Description                              |
| ------------- | ---------------------------------------- |
| user          | The username to authenticate             |
| password      | The password to authenticate             |
| url           | the ip adress to Postgres Server         |
| port          | the port to Postgres Server              |
| database      | The name of the Database                 |
| table         | The name of the Table in Database        |
| resetTable    | Set to true to create or reset the table |
````json
"sql": {
        "user": "postgres",
        "password": "root",
        "url": "127.0.0.1",
        "port": 5432,
        "database": "postgres",
        "table": "OPC-Log1",
        "resetTable": true
    },
````
### The third part is the definition of the link between the items of the OPCUA server and the columns of the database.
The field "items" is a array of objects. Each object is a Colum in the database.  
Each object has a opc and a sql object.  
To select an node from opc enter the nodeId or the path to the node ( a / is a folder and a . is a child type) and the type of the node.  
In the sql object enter the name and datatype of the colum in the database. The type must exist in Postgres!
````json
"items": [
    {
        "opc": {
            "nodeId": "ns=3;s=Scalar_Simulation_Double",
            "path":"",
            "type": "Double"
        },
        "sql": {
            "name": "doubleValue",
            "type": "DOUBLE PRECISION"
        }
    },
    {
        "opc": {
            "path":"/Objects/Server.ServerStatus.BuildInfo.ProductName",
            "type": "String"
        },
        "sql": {
            "name": "ProductName",
            "type": "Text"
        }
    },
    {...},
    {...}
]
````




````
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
 ````