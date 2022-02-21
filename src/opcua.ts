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



import {
    OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    AttributeIds,
    makeBrowsePath,
    ClientSubscription,
    TimestampsToReturn,
    MonitoringParametersOptions,
    ReadValueIdOptions,
    ClientMonitoredItem,
    DataValue,
    ClientSession,
    BrowseDescriptionLike
} from "node-opcua";
import { Client } from "ts-postgres";
import { appConfig, itemLink } from "./classes";
import { addEntry } from "./database";




/**
 * Connect to the OPC UA Sever
 * @param config the config
 * @returns the opcua client
 */
export function OpcConnect(config:appConfig):Promise<{client:OPCUAClient, session:ClientSession}> {
    return new Promise<{client:OPCUAClient, session:ClientSession}>(async (resolve) => {
        const connectionStrategy = {
            initialDelay: 1000,
            maxRetry: 1
        };
        // create the opcua client with no security, todo: add security options
        const client = OPCUAClient.create({
            applicationName: "DB_Client",
            connectionStrategy: connectionStrategy,
            securityMode: MessageSecurityMode.None,
            securityPolicy: SecurityPolicy.None,
            endpointMustExist: false
        });
        console.log("[opc] Connect to OPC-UA Server on %s",config.opc.url);
        // connect to the opcua client
        await client.connect(config.opc.url);
        // create a session with opcua client
        const session = await client.createSession();
        resolve({client:client, session:session});
    });
}
/**
 * create a subscription and link it to the database
 * @param sqlClient the sql client
 * @param config the config
 * @param opc then opc client and session
 * @returns 
 */
export function OpcCreateLinks(sqlClient:Client,config:appConfig,opc:{client:OPCUAClient, session:ClientSession}) {
    return new Promise<boolean>(async (resolve) => {
        // create a subscription, todo make the subscription interval configurable
        const subscription = ClientSubscription.create(opc.session, {
            requestedPublishingInterval: 1000,
            requestedLifetimeCount: 100,
            requestedMaxKeepAliveCount: 10,
            maxNotificationsPerPublish: 100,
            publishingEnabled: true,
            priority: 10
        });

        // add events to the subscription
        subscription
            .on("started", function () {
                console.log(
                    "[opc] Subscription started - subscriptionId=",
                    subscription.subscriptionId
                );
            })
            .on("keepalive", function () {
                console.log("[opc] Keepalive");
            })
            .on("terminated", function () {
                console.log("[opc] Terminated");
            });

        // add monitored items to subscription
        console.group("[opc] Create subscription:");
        config.items.forEach((item:itemLink) => {

            var nodeId = null;
            if (item.opc.nodeId) {
                nodeId = item.opc.nodeId;
            }
            else if (item.opc.path) {
                // GET NODEID By path

            }
            else {
                nodeId = null;
            }
            if (nodeId) {
                const itemToMonitor: ReadValueIdOptions = {
                    nodeId: nodeId,
                    attributeId: AttributeIds.Value
                };
                const parameters: MonitoringParametersOptions = {
                    samplingInterval: 100,
                    discardOldest: true,
                    queueSize: 1
                };

                const monitoredItem = ClientMonitoredItem.create(
                    subscription,
                    itemToMonitor,
                    parameters,
                    TimestampsToReturn.Both
                );
                
                console.log("[opc] Monitor %s%s of %s and store in %s as %s", 
                item.opc.path ? item.opc.path+", ": "", 
                nodeId,
                item.opc.type.toUpperCase(),
                item.sql.name,
                item.sql.type.toUpperCase());

                // add changed event
                monitoredItem.on("changed", (dataValue: DataValue) => {
                    // add value to db
                    addEntry(sqlClient,config,item,dataValue);

                });
            }
        });
        console.groupEnd();
        resolve(true);
    });
}
/**
 * disconnects form opcua server
 * @param config the config
 * @param opc then opc client and session
 * @returns 
 */
export function OpcDisconnect(config:appConfig,opc:{client:OPCUAClient, session:ClientSession}) {
    return new Promise<boolean>(async (resolve) => {
        await opc.session.close();
        await opc.client.disconnect();
        resolve(true);
    });
}


//*/

/*
//const endpointUrl = "opc.tcp://" + require("os").hostname() + ":4334/";
function browseAll(session: ClientSession, root: string, relative: string) {
    return new Promise(async (resolve, reject) => {
        var nodeId = null;
        const browsePath = makeBrowsePath(
            root,
            relative
        );

        const result = await session.translateBrowsePath(browsePath);

        if (result.statusCode.value == 2148466688 || root == "RootFolder" && relative == "") {
            console.log("Nothing");
            nodeId = "ns=0;i=84";
        }
        else if (result.statusCode.value == 0) {
            if (result.targets) {
                result.targets.forEach(target => {

                    nodeId = target.targetId.toString();
                });
            }
        }

        var browseDescription: BrowseDescriptionLike = {};
        browseDescription.nodeId = nodeId;
        browseDescription.resultMask = 63;

        console.log(`references of ${root}${relative} :`);
        const browseResult = await session.browse(browseDescription).catch((err)=> {

        });
        if (!browseResult || !browseResult.references) {
            return;
        }
        
        //console.log(browseResult)
        for (const reference of browseResult.references) {
            console.log("   -> ", reference.browseName.toString(),reference.referenceTypeId.value );
   
            if (reference.referenceTypeId.value != 47 ) {
                await browseAll(session,root, relative + "/" + reference.browseName.name);
            }
        }

        resolve(1);
    });
}

async function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    try {
        // step 1 : connect to
        await client.connect(endpointUrl);
        console.log("connected !");

        // step 2 : createSession
        const session = await client.createSession();
        console.log("session created !");

        // step 3 : browse
        /*const browseResult = await session.browse("RootFolder").catch((err)=> {

        });
        if (!browseResult || !browseResult.references) {
            return;
        }
        console.log("references of RootFolder :");
        for (const reference of browseResult.references) {
            console.log("   -> ", reference.browseName.toString());
        }
        //console.log(browseResult);
        // step 4 : read a variable with readVariableValue
        var sub = null
        if (sub) {
            const maxAge = 0;
            const nodeToRead = {
                nodeId: "ns=3;s=Scalar_Simulation_String",
                attributeId: AttributeIds.Value
            };
            const dataValue = await session.read(nodeToRead, maxAge);
            console.log(" value ", dataValue.toString());

            // step 4' : read a variable with read
            const dataValue2 = await session.read({
                nodeId: "ns=3;s=Scalar_Simulation_String",
                attributeId: AttributeIds.Value
            });
            console.log(" value = ", dataValue2.toString());

            // step 5: install a subscription and install a monitored item for 10 seconds
            const subscription = ClientSubscription.create(session, {
                requestedPublishingInterval: 1000,
                requestedLifetimeCount: 100,
                requestedMaxKeepAliveCount: 10,
                maxNotificationsPerPublish: 100,
                publishingEnabled: true,
                priority: 10
            });

            subscription
                .on("started", function () {
                    console.log(
                        "subscription started for 2 seconds - subscriptionId=",
                        subscription.subscriptionId
                    );
                })
                .on("keepalive", function () {
                    console.log("keepalive");
                })
                .on("terminated", function () {
                    console.log("terminated");
                });

            // install monitored item

            const itemToMonitor: ReadValueIdOptions = {
                nodeId: "ns=3;s=Scalar_Simulation_String",
                attributeId: AttributeIds.Value
            };
            const parameters: MonitoringParametersOptions = {
                samplingInterval: 100,
                discardOldest: true,
                queueSize: 10
            };

            const monitoredItem = ClientMonitoredItem.create(
                subscription,
                itemToMonitor,
                parameters,
                TimestampsToReturn.Both
            );

            monitoredItem.on("changed", (dataValue: DataValue) => {
                console.log(" value has changed : ", dataValue.value.toString());
            });

            await timeout(10000);

            console.log("now terminating subscription");
            await subscription.terminate();
        }

        // step 6: finding the nodeId of a node by Browse name
        var findname = false;
        if (findname) {
            const browsePath = makeBrowsePath(
                "RootFolder",
                "/Objects/Server.ServerStatus.BuildInfo.ProductName"
            );

            const result = await session.translateBrowsePath(browsePath);
            const productNameNodeId = result.targets;
            //console.log(" Product Name nodeId = ", productNameNodeId.toString());

            console.log(productNameNodeId);
        }
        // close session
        await session.close();

        // disconnecting
        await client.disconnect();
        console.log("done !");
    } catch (err) {
        console.log("An error has occured : ", err);
    }
}
//*/
