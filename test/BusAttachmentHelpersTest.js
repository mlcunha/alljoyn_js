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
AsyncTestCase("BusAttachmentHelpersTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
            assertEquals(0, bus.connect());
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, bus.disconnect());
        },

        testRequestReleaseName: function() {
            assertEquals(0, bus.requestName("org.alljoyn.testName", 0));
            assertEquals(0, bus.releaseName("org.alljoyn.testName"));
        },

        testAddRemoveMatch: function() {
            assertEquals(0, bus.addMatch("type='signal'"));
            assertEquals(0, bus.removeMatch("type='signal'"));
        },

        testAdvertiseCancelAdvertiseName: function() {
            assertEquals(0, bus.advertiseName("org.alljoyn.testName", 0xffff));
            assertEquals(0, bus.cancelAdvertiseName("org.alljoyn.testName", 0xffff));
        },

        testFindCancelFindAdvertisedName: function() {
            assertEquals(0, bus.findAdvertisedName("org.alljoyn.testName"));
            assertEquals(0, bus.cancelFindAdvertisedName("org.alljoyn.testName"));
        },

        testNameHasOwner: function() {
            assertTrue(bus.nameHasOwner("org.freedesktop.DBus"));
        },

        testSetDaemonDebug: function() {
            /* Will only succeed if the daemon was built in debug mode */
            bus.setDaemonDebug("ALL", 15);
            bus.setDaemonDebug("ALL", 0);
        },
    });
