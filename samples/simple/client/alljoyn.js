/*
 * Copyright 2011, Qualcomm Innovation Center, Inc.
 * 
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 * 
 *        http://www.apache.org/licenses/LICENSE-2.0
 * 
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
var client = (function() {
        var SERVICE_NAME = "org.alljoyn.bus.samples.simple",
            CONTACT_PORT = 42;
  
        var that,
            bus, 
            sessionId,
            isConnected = false,
            isStoppingDiscovery = false;
        
        var start = function() {
            var status;

            /*
             * All communication through AllJoyn begins with a BusAttachment.
             *
             * By default AllJoyn does not allow communication between devices (i.e. bus to bus
             * communication). The optional first argument must be set to true to allow
             * communication between devices.
             */
            bus = new org.alljoyn.bus.BusAttachment(true);
            /*
             * Register a bus listener to receive advertised names.  We look for a specific
             * advertised name below (the well-known SERVICE_NAME).
             */
            bus.registerBusListener({
                    onFoundAdvertisedName: function(name, transport, namePrefix) {
                        /*
                         * We found someone advertising the well-known SERVICE_NAME.  Now join a
                         * session of that someone.
                         */
                        var onJoined,
                            onError,
                            status;

                        /*
                         * If discovery is currently being stopped we won't join to any other
                         * sessions.
                         */
                        if (isStoppingDiscovery) {
                            return;
                        }
                        /* This function is called when we succesfully join a session. */
                        onJoined = function(id, opts) {
                            /*
                             * As a result of joining the session, we get a session identifier which
                             * we must use to identify the created session communication channel
                             * whenever we talk to the remote side.
                             *
                             * Save the session identifier until we try to talk to the remote side.
                             */
                            sessionId = id;
                            isConnected = true;
                            that.onstatus("Session '" + id + "' joined");
                        };
                        onError = function(error) {
                            alert("Join session '" + name + "' failed " + error);
                        };
                        /*
                         * In order to join the session, we need to provide the well-known contact
                         * port.  This is pre-arranged between both sides as part of the definition
                         * of the simple service.
                         */
                        status = bus.joinSession(onJoined, onError, {
                                host: name,
                                port: CONTACT_PORT,
                                onLost: function(id) { that.onstatus("Session '" + id + "' lost"); }
                            });
                        if (status) {
                            alert("Join session '" + name + "' failed [(" + status + ")]");
                            return;
                        }
                    }
                });
            /* To communicate with AllJoyn objects, we must connect the BusAttachment to the bus. */
            status = bus.connect();
            if (status) {
                alert("Connect to AllJoyn failed [(" + status + ")]");
                return;
            }
            /*
             * Now find an instance of the AllJoyn object we want to call.  We start by looking for
             * a name, then join a session of the device that is advertising that name.
             *
             * In this case, we are looking for the well-known SERVICE_NAME.
             */
            status = bus.findAdvertisedName(SERVICE_NAME);
            if (status) {
                alert("Find '" + SERVICE_NAME + "' failed [(" + status + ")]");
                return;
            }
        };

        that = {};

        that.start = function() {
            /* The user must allow the page to access AllJoyn. */
            navigator.requestPermission("org.alljoyn.bus", function() { start(); });
        }

        that.stop = function() {
            var status;

            /* Release all resources acquired in the start. */
            isStoppingDiscovery = true;
            if (isConnected) {
                status = bus.leaveSession(sessionId);
                if (status) {
                    alert("Leave session failed [(" + status + ")]");
                    return;
                }
            }
            status = bus.disconnect();
            if (status) {
                alert("Disconnect from AllJoyn failed [(" + status + ")]");
                return;
            }
        };

        /*
         * Call the service's Ping method through a ProxyBusObject.
         *
         * This will also log the string that was sent to the service and the string that was
         * received from the service to the user interface.
         */
        that.ping = function(str) {
            var onPingReply,
                onError,
                proxyObj,
                simpleInterface;

            /*
             * To communicate with an AllJoyn object, we create a ProxyBusObject.  A ProxyBusObject
             * is composed of a name, path, and sessionID.
             * 
             * This ProxyBusObject is located at the well-known SERVICE_NAME, under path
             * "/SimpleService", and uses the sessionID we received earlier when we joined the
             * session.
             */
            proxyObj = bus.proxy[SERVICE_NAME + "/SimpleService:sessionId=" + sessionId];
            /*
             * The Ping method exists on the SimpleInterface AllJoyn interface implemented by the
             * proxyObj.
             */
            simpleInterface = proxyObj["org.alljoyn.bus.samples.simple.SimpleInterface"];

            onPingReply = function(context, str) {
                that.onping(context.sender, str);
            };
            onError = function(error) {
                that.onstatus("Ping failed " + error);
            };
            that.onping("Me", str);
            /* Make the Ping method call on the simpleInterface proxy object's interface. */
            simpleInterface.Ping(onPingReply, onError, str);
        };

        return that;
    }());
