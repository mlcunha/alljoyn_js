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
var alljoyn = (function() {
        /*
         * The well-known name prefix which all bus attachments hosting a channel will use.  
         *
         * The NAME_PREFIX and the channel name are composed to give the well-known name that a
         * hosting bus attachment will request and advertise.
         */
        var NAME_PREFIX = "org.alljoyn.bus.samples.chat",
	/* The well-known session port used as the contact port for the chat service. */
            CONTACT_PORT = 27,
        /* The object path used to identify the service "location" in the bus attachment. */
            OBJECT_PATH = "/chatService";

        var that,
            aj,
            bus,
            channelName,
            channelNames,
            sessionId,
            addChannelName,
            removeChannelName;

        /*
         * Get the instance of our plugin.  All our scripting will begin with this.
         */
        aj = org.alljoyn.bus;

	/*
	 * The channels list is the list of all well-known names that correspond to channels we
	 * might conceivably be interested in.  The "use" tab will display this list in the
	 * "joinChannel" form.  Choosing one will result in a joinSession call.
	 */
        channelNames = [];
        addChannelName = function(name) {
            name = name.slice(NAME_PREFIX.length + 1);
            removeChannelName(name);
            channelNames.push(name);
        };
        removeChannelName = function(name) {
            name = name.slice(NAME_PREFIX.length + 1);
            for (var i = 0; i < channelNames.length; ++i) {
                if (channelNames[i] === name) {
                    channelNames.splice(i, 1);
                    break;
                }
            }
        };

        var start = function() {
            var status,
                onChat;

            /*
             * All communication through AllJoyn begins with a BusAttachment.
             *
             * By default AllJoyn does not allow communication between devices (i.e. bus to bus
             * communication). The optional first argument must be set to true to allow
             * communication between devices.
             */
            bus = new aj.BusAttachment(true);
            /*
             * Register an instance of an AllJoyn bus listener that knows what to do with found and
             * lost advertised name notifications.
             */
            bus.registerBusListener({
                    /*
                     * This method is called when AllJoyn discovers a remote attachment that is
                     * hosting a chat channel.  We expect that since we only do a findAdvertisedName
                     * looking for instances of the chat well-known name prefix we will only find
                     * names that we know to be interesting.  When we find a remote application that
                     * is hosting a channel, we add its channel name it to the list of available
                     * channels selectable by the user.
                     */
                    onFoundAdvertisedName: function(name, transport, namePrefix) {
                        addChannelName(name);
                        that.onname();
                    },
                    /*
                     * This method is called when AllJoyn decides that a remote bus attachment that
                     * is hosting a chat channel is no longer available.  When we lose a remote
                     * application that is hosting a channel, we remote its name from the list of
                     * available channels selectable by the user.
                     */
                    onLostAdvertisedName: function(name, transport, namePrefix) {
                        removeChannelName(name);
                        that.onname();
                    }
                });
            /*
             * Specify an AllJoyn interface.  The name by which this interface will be known is the
             * property name of the bus.interfaces object.  In this case, it is
             * "org.alljoyn.bus.samples.chat".
             */
            bus.interfaces["org.alljoyn.bus.samples.chat"] = {
                /*
                 * Specify a Chat signal of the interface.  The argument of the signal is a string.
                 */
                signal: [
                    { name: "Chat", signature: "s", argNames: "str" }
                ]
            };
            /* 
             * To make a service available to other AllJoyn peers, first register a BusObject with
             * the BusAttachment at a specific object path.  Our service is implemented by the
             * ChatService BusObject found at the "/chatService" object path.
             */
            bus[OBJECT_PATH] = {
                "org.alljoyn.bus.samples.chat": {
                    /*
                     * Signal emitter methods are created implicitly when the bus object is
                     * registered.  When registration is complete, there will exist a method
                     * 'bus[OBJECT_PATH]["org.alljoyn.bus.samples.chat"].Chat'.
                     */
                }
            };
            /* Connect the BusAttachment to the bus. */
            status = bus.connect();
            if (status) {
                alert("Connect to AllJoyn failed [(" + status + ")]");
                return;
            }
            /*
             * The signal handler for messages received from the AllJoyn bus.
             * 
             * Since the messages sent on a chat channel will be sent using a bus signal, we need to
             * provide a signal handler to receive those signals.  This is it.
             */
            onChat = function(context, str) {
                /*
                 * There are aspects of multipoint sessions using signals that are perhaps a little
                 * counter-intuitive.  This deserves a comment here since we have some code to deal
                 * with a couple of special cases.
                 * 
                 * The root of this situation is that we have a single bus attachment that can both
                 * host multipoint sessions using bindSessionPort() and can join them using
                 * joinSession().  This works great until we join the same session we have bound.
                 * 
                 * When we bind a session port, we set up a listener to either accept or reject
                 * session joiners.  In our case, we accept any joiner that can get the contact port
                 * right.  This results in an implicit joining of the session, with the session ID
                 * passed to the SessionJoinedListener callback.  We don't use that session ID, but
                 * as a side-effect, routing of signals from the bus to our bus attachment are
                 * enabled.
                 * 
                 * When we join a session, we also enable the routing of signals from the bus to our
                 * bus attachment.
                 * 
                 * We send our chat messages over signals.  Signals are not "echoed" back to the
                 * source, so we do that echo below in that.chat using the nickname "Me."
                 * 
                 * Whenever we have a hosted session running and we have had a joiner on our
                 * session, we have signals enabled on the session.  We will receive messages sent
                 * to the multipoint session.  This means we have to deal with two corner cases:
                 * 
                 * (1) If the application is hosting a channel, and the user has joined/used another
                 *     channel, we must prevent messages sent on the hosted channel from being
                 *     displayed on the used channel history.  In this case, the session ID of the
                 *     hosted channel and the used channel will be different and so we filter the
                 *     messages on the sessionId.
                 *     
                 * (2) If the application is hosting a channel, and the user has joined/used that
                 *     channel, when a user types a message it will be sent out over the multipoint
                 *     session and not be echoed locally.  However, since there is an immplied join
                 *     when the hosting session returns true from onAccept, any messages sent by the
                 *     joiner will be received by the hosting session and it will look like the
                 *     messages were echoed.  In this case, the sender's unique ID will be the same
                 *     as our own bus attachment and we filter the messages on the sender.
                 */
                if (context.sessionId !== sessionId || context.sender === bus.uniqueName) {
                    return;
                }
                that.onchat(context.sender, str);
            };
            bus.registerSignalHandler(onChat, "org.alljoyn.bus.samples.chat.Chat");
            /*
             * Start discovering any attachments that are hosting chat sessions.  Since this is a
             * core bit of functionalty for the "use" side of the app, we always do this at startup.
             */
            status = bus.findAdvertisedName(NAME_PREFIX);
            if (status) {
                alert("Find name '" + NAME_PREFIX + "' failed [(" + status + ")]");
                return;
            }
        };

        that = {
            get channelNames() { return channelNames; }
        };

        that.start = function() {
            navigator.requestPermission("org.alljoyn.bus", function() { start(); });
        }

        /*
         * Starting a channel consists of binding a session port, requesting a well-known name, and
         * advertising the well-known name.
         */
        that.startChannel = function(name) {
            var wellKnownName = NAME_PREFIX + '.' + name,
                status;

            /* Create a new session listening on the contact port of the chat service. */
            status = bus.bindSessionPort({
                    port: CONTACT_PORT, 
                    isMultipoint: true,
                    onAccept: function(port, joiner, opts) { 
                        return (port === CONTACT_PORT); 
                    }
                });
            if (status) {
                alert("Bind session port " + CONTACT_PORT + " failed [(" + status + ")]");
                return status;
            }
            /* Request a well-known name from the bus... */
            status = bus.requestName(wellKnownName, aj.BusAttachment.DBUS_NAME_FLAG_DO_NOT_QUEUE);
            if (status) {
                alert("Request name '" + wellKnownName + "' failed [(" + status + ")]");
                return status;
            }
            /* ...and advertise the same well-known name. */
            status = bus.advertiseName(wellKnownName, aj.SessionOpts.TRANSPORT_ANY);
            if (status) {
                alert("Advertise name '" + wellKnownName + "' failed [(" + status + ")]");
                return status;
            }

            channelName = name;
            return 0;
        };

        /* Releases all resources acquired in startChannel. */
        that.stopChannel = function() {
            var wellKnownName = NAME_PREFIX + '.' + channelName,
                status;

            status = bus.cancelAdvertiseName(wellKnownName, aj.SessionOpts.TRANSPORT_ANY);
            if (status) {
                alert("Cancel advertise name '" + wellKnownName + "' failed [(" + status + ")]");
                return;
            }
            bus.unbindSessionPort(CONTACT_PORT);
            status = bus.releaseName(wellKnownName);
            if (status) {
                alert("Release name '" + wellKnownName + "' failed [(" + status + ")]");
                return;
            }
        };

        /* Joins an existing session. */
        that.joinChannel = function(onjoined, onerror, name) {
            /*
             * The well-known name of the existing session is the concatenation of the NAME_PREFIX
             * and a channel name from the channelNames array.
             */
            var wellKnownName = NAME_PREFIX + '.' + name,
                onJoined,
                onError,
                status;
                
            onJoined = function(id, opts) {
                sessionId = id;
                onjoined();
            };
            onError = function(error) {
                alert("Join session '" + wellKnownName + "' failed " + error);
                onerror();
            };
            status = bus.joinSession(onJoined, onError, {
                    host: wellKnownName,
                    port: CONTACT_PORT,
                    isMultipoint: true,
                    /*
                     * This method is called when the last remote participant in the chat session
                     * leaves for some reason and we no longer have anyone to chat with.
                     */
                    onLost: function(id) {
                        that.onlost(name);
                    }
                });
            if (status) {
                alert("Join session '" + wellKnownName + "' failed [(" + status + ")]");
                return status;
            }
            return 0;
        };

        /* Releases all resources acquired in joinChannel. */
        that.leaveChannel = function() {
            bus.leaveSession(sessionId);
        };

        /* Sends a message out over an existing remote session. */
        that.chat = function(str) {
            try {
                /*
                 * This is a call to the implicit signal emitter method described above when the bus
                 * object was registered.  Note the use of the optional parameters to specify the
                 * session ID of the remote session.
                 */
                bus[OBJECT_PATH]["org.alljoyn.bus.samples.chat"].Chat(str, { sessionId: sessionId });
                that.onchat("Me", str);
            } catch (err) {
                /*
                 * The interface for throwing exceptions between the browser and the AllJoyn plugin
                 * is insufficient for throwing real JavaScript exceptions, and the implementation
                 * is inconsistent between browsers.  This alert shows the workaround of accessing
                 * properties of the BusError interface object to get complete exception info.
                 */
                alert("Chat failed [" + aj.BusError.name + ": " + 
                      (aj.BusError.message ? (aj.BusError.message + " ") : "") + 
                      "(" + aj.BusError.code + ")]");
            }
        };
        
        return that;
    }());
