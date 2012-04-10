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
AsyncTestCase("MessageArgCountTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");

            bus = new alljoyn.BusAttachment();
            bus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                method: [
                    { name: 'Ping', signature: 's', returnSignature: 's' }
                ]
            };
            assertEquals(0, bus.connect());

            otherBus = new alljoyn.BusAttachment();
            assertEquals(0, otherBus.connect());
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, otherBus.disconnect());
            assertEquals(0, bus.disconnect());
        },

        testReplyError0: function(queue) {
            queue.call(function(callbacks) {
                    bus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) { 
                                assertError(function() { context.replyError(); }, "TypeError");
                                context.replyError(1);
                            }
                        }
                    };
                    var testobject = otherBus.proxy[bus.uniqueName + "/testobject"];
                    var onPing = callbacks.addErrback(function() {});
                    var onErr = callbacks.add(function() {});
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, "hello");
                });
        },

        testReplyError1: function(queue) {
            queue.call(function(callbacks) {
                    bus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) { 
                                assertNoError(function() { context.replyError(1); });
                            }
                        }
                    };
                    var testobject = otherBus.proxy[bus.uniqueName + "/testobject"];
                    var onPing = callbacks.addErrback(function() {});
                    var onErr = callbacks.add(function() {});
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, "hello");
                });
        },

        testReplyError2: function(queue) {
            queue.call(function(callbacks) {
                    bus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) { 
                                assertNoError(function() { context.replyError("name", "message"); });
                            }
                        }
                    };
                    var testobject = otherBus.proxy[bus.uniqueName + "/testobject"];
                    var onPing = callbacks.addErrback(function() {});
                    var onErr = callbacks.add(function() {});
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, "hello");
                });
        },
    });
