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
TestCase("BusAttachmentArgCountTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
            otherBus = undefined;
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            if (otherBus) {
                assertEquals(0, otherBus.disconnect());
                otherBus = undefined;
            }
            assertEquals(0, bus.disconnect());
        },

        testConstructor0: function() {
            assertNoError(function() { new alljoyn.BusAttachment(); });
        },
        testConstructor1: function() {
            assertNoError(function() { new alljoyn.BusAttachment(true); });
        },

        testConnect0: function() {
            assertNoError(function() { bus.connect(); });
        },
        testConnect1: function() {
            assertNoError(function() { bus.connect("connectSpec"); });
        },

        testDisconnect0: function() {
            assertNoError(function() { bus.disconnect(); });
        },

        testRegisterSignalHandler0: function() {
            assertError(function() { bus.registerSignalHandler(); }, "TypeError");
        },
        testRegisterSignalHandler1: function() {
            assertError(function() { bus.registerSignalHandler(function() {}); }, "TypeError");
        },
        testRegisterSignalHandler2: function() {
            assertNoError(function() { bus.registerSignalHandler(function() {}, "signalName"); });
        },
        testRegisterSignalHandler3: function() {
            assertNoError(function() { bus.registerSignalHandler(function() {}, "signalName", "sourcePath"); });
        },

        testUnregisterSignalHandler0: function() {
            assertError(function() { bus.unregisterSignalHandler(); }, "TypeError");
        },
        testUnregisterSignalHandler1: function() {
            assertError(function() { bus.unregisterSignalHandler(function() {}); }, "TypeError");
        },
        testUnregisterSignalHandler2: function() {
            assertNoError(function() { bus.unregisterSignalHandler(function() {}, "signalName"); });
        },
        testUnregisterSignalHandler3: function() {
            assertNoError(function() { bus.unregisterSignalHandler(function() {}, "signalName", "sourcePath"); });
        },

        testRegisterBusListener0: function() {
            assertError(function() { bus.registerBusListener(); }, "TypeError");
        },
        testRegisterBusListener1: function() {
            assertNoError(function() { bus.registerBusListener(function() {}); });
        },
        testUnregisterBusListener0: function() {
            assertError(function() { bus.unregisterBusListener(); }, "TypeError");
        },
        testUnregisterBusListener1: function() {
            assertNoError(function() { bus.unregisterBusListener(function() {}); });
        },

        testRequestName0: function() {
            assertError(function() { bus.requestName(); }, "TypeError");
        },
        testRequestName1: function() {
            assertNoError(function() { bus.requestName("requestedName"); });
        },
        testRequestName2: function() {
            assertNoError(function() { bus.requestName("requestedName", 0); });
        },

        testReleaseName0: function() {
            assertError(function() { bus.releaseName(); }, "TypeError");
        },
        testReleaseName1: function() {
            assertNoError(function() { bus.releaseName("name"); });
        },

        testAddMatch0: function() {
            assertError(function() { bus.addMatch(); }, "TypeError");
        },
        testAddMatch1: function() {
            assertNoError(function() { bus.addMatch("rule"); });
        },

        testRemoveMatch0: function() {
            assertError(function() { bus.removeMatch(); }, "TypeError");
        },
        testRemoveMatch1: function() {
            assertNoError(function() { bus.removeMatch("rule"); });
        },

        testAdvertiseName0: function() {
            assertError(function() { bus.advertiseName(); }, "TypeError");
        },
        testAdvertiseName1: function() {
            assertError(function() { bus.advertiseName("name"); }, "TypeError");
        },
        testAdvertiseName2: function() {
            assertNoError(function() { bus.advertiseName("name", 0); });
        },

        testCancelAdvertiseName0: function() {
            assertError(function() { bus.cancelAdvertiseName(); }, "TypeError");
        },
        testCancelAdvertiseName1: function() {
            assertError(function() { bus.cancelAdvertiseName("name"); }, "TypeError");
        },
        testCancelAdvertiseName2: function() {
            assertNoError(function() { bus.cancelAdvertiseName("name", 0); });
        },

        testFindAdvertisedName0: function() {
            assertError(function() { bus.findAdvertisedName(); }, "TypeError");
        },
        testFindAdvertisedName1: function() {
            assertNoError(function() { bus.findAdvertisedName("namePrefix"); });
        },

        testCancelFindAdvertisedName0: function() {
            assertError(function() { bus.cancelFindAdvertisedName(); }, "TypeError");
        },
        testCancelFindAdvertisedName1: function() {
            assertNoError(function() { bus.cancelFindAdvertisedName("namePrefix"); });
        },

        testBindSessionPort0: function() {
            assertError(function() { bus.bindSessionPort(); }, "TypeError");
        },
        testBindSessionPort1: function() {
            assertNoError(function() { bus.bindSessionPort({}); });
        },

        testUnbindSessionPort0: function() {
            assertError(function() { bus.unbindSessionPort(); }, "TypeError");
        },
        testUnbindSessionPort1: function() {
            assertNoError(function() { bus.unbindSessionPort(0); });
        },

        testSetSessionListener0: function() {
            assertError(function() { bus.setSessionListener(); }, "TypeError");
        },
        testSetSessionListener1: function() {
            assertError(function() { bus.setSessionListener(0); }, "TypeError");
        },
        testSetSessionListener2: function() {
            assertNoError(function() { bus.setSessionListener(0, function() {}); });
        },

        testJoinSession0: function() {
            assertError(function() { bus.joinSession(); }, "TypeError");
        },
        testJoinSession1: function() {
            assertError(function() { bus.joinSession(function() {}); }, "TypeError");
        },
        testJoinSession2: function() {
            assertError(function() { bus.joinSession(function() {}, function() {}); }, "TypeError");
        },
        testJoinSession3: function() {
            assertNoError(function() { bus.joinSession(function() {}, function() {}, { host: 0, port: 1 }); });
        },

        testLeaveSession0: function() {
            assertError(function() { bus.leaveSession(); }, "TypeError");
        },
        testLeaveSession1: function() {
            assertNoError(function() { bus.leaveSession(0); });
        },

        testSetLinkTimeout0: function() {
            assertError(function() { bus.setLinkTimeout(); }, "TypeError");
        },
        testSetLinkTimeout1: function() {
            assertError(function() { bus.setLinkTimeout(1); }, "TypeError");
        },
        testSetLinkTimeout2: function() {
            assertError(function() { bus.setLinkTimeout(1, 1); }, "BusError");
        },

        testNameHasOwner0: function() {
            assertError(function() { bus.nameHasOwner(); }, "TypeError");
        },
        testNameHasOwner1: function() {
            assertError(function() { bus.nameHasOwner("name"); }, "BusError");
        },

        testSetDaemonDebug0: function() {
            assertError(function() { bus.setDaemonDebug(); }, "TypeError");
        },
        testSetDaemonDebug1: function() {
            assertError(function() { bus.setDaemonDebug("_module"); }, "TypeError");
        },
        testSetDaemonDebug2: function() {
            assertNoError(function() { bus.setDaemonDebug("_module", 0); });
        },

        testEnablePeerSecurity0: function() {
            assertError(function() { bus.enablePeerSecurity(); }, "TypeError");
        },
        testEnablePeerSecurity1: function() {
            assertNoError(function() { bus.enablePeerSecurity("authMechanisms"); });
        },
        testEnablePeerSecurity2: function() {
            assertNoError(function() { bus.enablePeerSecurity("authMechanisms", function() {}); });
        },

        testReloadKeyStore0: function() {
            assertNoError(function() { bus.reloadKeyStore(); });
        },

        testClearKeyStore0: function() {
            assertNoError(function() { bus.clearKeyStore(); });
        },

        testClearKeys0: function() {
            assertError(function() { bus.clearKeys(); }, "TypeError");
        },
        testClearKeys1: function() {
            assertNoError(function() { bus.clearKeys("guid"); });
        },

        testSetKeyExpiration0: function() {
            assertError(function() { bus.setKeyExpiration(); }, "TypeError");
        },
        testSetKeyExpiration1: function() {
            assertError(function() { bus.setKeyExpiration("guid"); }, "TypeError");
        },
        testSetKeyExpiration2: function() {
            assertNoError(function() { bus.setKeyExpiration("guid", 0); }, "TypeError");
        },

        testGetKeyExpiration0: function() {
            assertError(function() { bus.getKeyExpiration(); }, "TypeError");
        },
        testGetKeyExpiration1: function() {
            assertError(function() { bus.getKeyExpiration("guid"); }, "BusError");
        },

        testAddLogonEntry0: function() {
            assertError(function() { bus.addLogonEntry(); }, "TypeError");
        },
        testAddLogonEntry1: function() {
            assertError(function() { bus.addLogonEntry("authMechanism"); }, "TypeError");
        },
        testAddLogonEntry2: function() {
            assertError(function() { bus.addLogonEntry("authMechanism", "userName"); });
        },
        testAddLogonEntry3: function() {
            assertNoError(function() { bus.addLogonEntry("authMechanism", "userName", "password"); });
        },

        testGetPeerGUID0: function() {
            assertError(function() { bus.getPeerGUID(); }, "TypeError");
        },
        testGetPeerGUID1: function() {
            assertError(function() { bus.getPeerGUID("name"); }, "BusError");
        },
    });
