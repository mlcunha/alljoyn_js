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
AsyncTestCase("ProxyMethodTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, bus.disconnect());
        },

        testNoReply: function(queue) {
            queue.call(function(callbacks) {
                    bus.interfaces["org.alljoyn.bus.NoReply"] = {
                        method: [
                            { name: 'Ping', signature: 's', argNames: 'inStr', 
                              'org.freedesktop.DBus.Method.NoReply': true }
                        ]
                    };
                    bus["/testobject"] = {
                        "org.alljoyn.bus.NoReply": {
                            Ping: callbacks.add(function(context, inStr) {})
                        }
                    };
                    assertEquals(0, bus.connect());

                    var testobject = bus.proxy[bus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.NoReply"].Ping(null, callbacks.addErrback("testNoReply", onError), "hello");
                    /* Wait to make sure no reply has been received. */
                    window.setTimeout(callbacks.noop(), 250);
                });
        },

        testFlags: function(queue) {
            queue.call(function(callbacks) {
                    bus.interfaces["org.alljoyn.bus.Flags"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    bus["/testobject"] = {
                        "org.alljoyn.bus.Flags": {
                            Ping: callbacks.add(function(context, inStr) { 
                                    assertEquals(0x02, context.flags & 0x02);
                                    assertEquals(0, context.reply(inStr));
                                })
                        }
                    };
                    assertEquals(0, bus.connect());

                    var onErr = callbacks.addErrback("testFlags", onError);
                    var onPing = callbacks.add(function(context, outStr) {});
                    var testobject = bus.proxy[bus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.Flags"].Ping(onPing, onErr, "hello", { flags: 0x02 });
                });
        },

        testTimeout: function(queue) {
            queue.call(function(callbacks) {

                    bus.interfaces["org.alljoyn.bus.Timeout"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    bus["/testobject"] = {
                        "org.alljoyn.bus.Timeout": {
                            Ping: function(context, inStr) { /* no reply */ }
                        }
                    };
                    assertEquals(0, bus.connect());

                    var onErr = callbacks.add(function(error) {
                            assertEquals("org.alljoyn.Bus.Timeout", error.name);
                        });
                    var onPing = callbacks.addErrback("testTimeout", function(context, outStr) {});
                    var testobject = bus.proxy[bus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.Timeout"].Ping(onPing, onErr, "hello", { timeout: 10 });
                });
        },
    });
