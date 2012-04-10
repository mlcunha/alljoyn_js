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
AsyncTestCase("SimpleTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            serviceBus = new alljoyn.BusAttachment();
            clientBus = new alljoyn.BusAttachment();
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, clientBus.disconnect());
            assertEquals(0, serviceBus.disconnect());
        },

        testSimple: function(queue) {
            queue.call(function(callbacks) {
                    /* Create a Ping service attachment. */
                    serviceBus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    serviceBus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) { assertEquals(0, context.reply(inStr)); }
                        }
                    };
                    assertEquals(0, serviceBus.connect());

                    /* Create a Ping client attachment. */
                    assertEquals(0, clientBus.connect());
                    
                    /*
                     * Now kick off the Ping.  This needs to be synchronized to not Ping until the
                     * service has acquired its name.
                     */
                    var onErr = callbacks.addErrback(onError);
                    var onRequestName = callbacks.add(function(context, result) {
                            assertEquals(1, result);
                            var testobject = clientBus.proxy["org.alljoyn.bus.samples.simple/testobject"];
                            testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, 
                                                                                              "hello");
                        });
                    var onPing = callbacks.add(function(context, outStr) {
                            assertEquals("hello", outStr);
                        });
                    var dbus = serviceBus.proxy["org.freedesktop.DBus/org/freedesktop/DBus"];
                    dbus["org.freedesktop.DBus"].RequestName(onRequestName, onErr, 
                                                             "org.alljoyn.bus.samples.simple", 0);
                });
        }
    });
