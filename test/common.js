/*
 * Copyright 2011-2012, Qualcomm Innovation Center, Inc.
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
function assertError(callback, error) {
    try {
        callback();
    } catch(e) {
        if (error && org.alljoyn.bus.BusError.name != error) {
            fail("expected to throw " + error + " but threw " + org.alljoyn.bus.BusError.name);
        }
        return true;
    }
    fail("expected to throw exception");
}

function assertNoError(callback) {
    try {
        callback();
    } catch(e) {
        fail("expected not to throw exception, but threw " + org.alljoyn.bus.BusError.name + " (" + org.alljoyn.bus.BusError.message + ")");
    }
}

function assertFalsy(actual) {
    if (actual) {
        fail("expected falsy but was " + actual);
    }
}

function ondeviceready(f) {
    return function(callback) {
        if (window.cordova) {
            document.addEventListener('deviceready', function() { f(callback); }, false);
        } else {
            f(callback);
        };
    };
};


