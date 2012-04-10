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
function onError(error) {
    fail(error.name + ": " + error.message + " (" + error.code + ")");
};

function assertError(callback, error) {
    try {
        callback();
    } catch(e) {
        if (error && alljoyn.BusError.name != error) {
            fail("expected to throw " + error + " but threw " + alljoyn.BusError.name);
        }
        return true;
    }
    fail("expected to throw exception");
}

function assertNoError(callback) {
    try {
        callback();
    } catch(e) {
        fail("expected not to throw exception, but threw " + alljoyn.BusError.name + " (" + alljoyn.BusError.message + ")");
    }
}
