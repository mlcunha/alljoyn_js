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
AsyncTestCase("ProxyInterfaceTest", {
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

        testEnumerate: function(queue) {
            queue.call(function(callbacks) {
                    var proxy = bus.proxy["org.alljoyn.Bus/org/alljoyn/Bus"];
                    assertEquals(0, bus.connect());
                    var onIntrospect = callbacks.add(function() {
                            var actual = {};
                            for (var name in proxy["org.alljoyn.Bus"]) {
                                actual[name] = proxy["org.alljoyn.Bus"][name];
                            }
                            /*
                             * Chrome and Firefox both return an Object for the proxy
                             * interfaces.  Android returns a Function.
                             */
                            assertNotNull(actual["BusHello"]);
                            assertNotNull(actual["Connect"]);
                            assertNotNull(actual["Disconnect"]);
                            assertNotNull(actual["StartListen"]);
                            assertNotNull(actual["StopListen"]);
                            assertNotNull(actual["AdvertiseName"]);
                            assertNotNull(actual["CancelAdvertiseName"]);
                            assertNotNull(actual["FindName"]);
                            assertNotNull(actual["CancelFindName"]);
                            assertNotNull(actual["ListAdvertisedNames"]);
                        });
                    proxy.introspect(onIntrospect, callbacks.addErrback(onError));
                });
        },
    });
