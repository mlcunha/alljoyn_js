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
TestCase("ProxyMethodArgCountTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
            bus.interfaces["org.alljoyn.bus.NoReply"] = {
                method: [
                    { name: 'Ping', signature: 's', argNames: 'inStr' }
                ]
            };
            bus["/testobject"] = {
                "org.alljoyn.bus.NoReply": {
                    Ping: function(context, inStr) {}
                }
            };
            assertEquals(0, bus.connect());
            testobject = bus.proxy[bus.uniqueName + "/testobject"];
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, bus.disconnect());
        },

        testMethodCall0: function() {
            assertError(function () { testobject["org.alljoyn.bus.NoReply"].Ping(); }, "TypeError");
        },
        testMethodCall1: function() {
            assertError(function () { testobject["org.alljoyn.bus.NoReply"].Ping(null); }, "TypeError");
        },
        testMethodCall2: function() {
            assertNoError(function () { testobject["org.alljoyn.bus.NoReply"].Ping(null, function() {}); });
        },
    });
