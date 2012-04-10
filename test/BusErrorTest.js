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
TestCase("BusErrorTest", {
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

        testBusError: function() {
            try {
                bus.nameHasOwner("test.foo");
            } catch (err) {
                assertEquals("BusError", alljoyn.BusError.name);
                assertEquals(alljoyn.BusError.BUS_NOT_CONNECTED, alljoyn.BusError.code);
            }
        },

        testTypeError: function() {
            try {
                bus.registerSignalHandler();
            } catch (err) {
                assertEquals("TypeError", alljoyn.BusError.name);
                assertEquals("not enough arguments", alljoyn.BusError.message);
            }
        },
    });

