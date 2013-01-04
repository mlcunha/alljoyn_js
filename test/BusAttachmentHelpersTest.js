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
    _setUp: ondeviceready(function(callback) {
        bus = new org.alljoyn.bus.BusAttachment();
        var connect = function(err) {
            assertUndefined(err)
            bus.connect(callback);
        };
        bus.create(false, connect);
    }),
    tearDown: function() {
        bus.destroy();
    },

    testRequestReleaseName: function(queue) {
        queue.call(function(callbacks) {
            var requestName = function(err) {
                assertUndefined(err)
                bus.requestName("org.alljoyn.testName", 0, callbacks.add(releaseName));
            };
            var releaseName = function(err) {
                assertUndefined(err)
                bus.releaseName("org.alljoyn.testName", callbacks.add(done));
            };
            var done = function(err) {
                assertUndefined(err)
            };
            this._setUp(callbacks.add(requestName));
        });
    },

    testAddRemoveMatch: function(queue) {
        queue.call(function(callbacks) {
            var addMatch = function(err) {
                assertUndefined(err)
                bus.addMatch("type='signal'", callbacks.add(removeMatch));
            };
            var removeMatch = function(err) {
                assertUndefined(err)
                bus.removeMatch("type='signal'", callbacks.add(done));
            };
            var done = function(err) {
                assertUndefined(err)
            };
            this._setUp(callbacks.add(addMatch));
        });
    },

    testAdvertiseCancelAdvertiseName: function(queue) {
        queue.call(function(callbacks) {
            var advertiseName = function(err) {
                assertUndefined(err)
                bus.advertiseName("org.alljoyn.testName", 0xffff, callbacks.add(cancelAdvertiseName));
            };
            var cancelAdvertiseName = function(err) {
                assertUndefined(err)
                bus.cancelAdvertiseName("org.alljoyn.testName", 0xffff, callbacks.add(done));
            };
            var done = function(err) {
                assertUndefined(err)
            };
            this._setUp(callbacks.add(advertiseName));
        });
    },

    testFindCancelFindAdvertisedName: function(queue) {
        queue.call(function(callbacks) {
            var findAdvertisedName = function(err) {
                assertUndefined(err)
                bus.findAdvertisedName("org.alljoyn.testName", callbacks.add(cancelFindAdvertisedName));
            };
            var cancelFindAdvertisedName = function(err) {
                assertUndefined(err)
                bus.cancelFindAdvertisedName("org.alljoyn.testName", callbacks.add(done));
            };
            var done = function(err) {
                assertUndefined(err)
            };
            this._setUp(callbacks.add(findAdvertisedName));
        });
    },

    testNameHasOwner: function(queue) {
        queue.call(function(callbacks) {
            var nameHasOwner = function(err) {
                assertUndefined(err)
                bus.nameHasOwner("org.freedesktop.DBus", callbacks.add(done));
            };
            var done = function(err, hasOwner) {
                assertUndefined(err)
                assertTrue(hasOwner);
            };
            this._setUp(callbacks.add(nameHasOwner));
        });
    },

    testSetDaemonDebug: function(queue) {
        queue.call(function(callbacks) {
            /* Will only succeed if the daemon was built in debug mode */
            var set = function(err) {
                bus.setDaemonDebug("ALL", 15, callbacks.add(clear));
            };
            var clear = function(err) {
                bus.setDaemonDebug("ALL", 0, callbacks.add(done));
            };
            var done = function(err) {
            };
            this._setUp(callbacks.add(set));
        });
    },
});
