/*
 * Copyright 2012, Qualcomm Innovation Center, Inc.
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

package org.alljoyn.bus;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;

public class AllJoyn extends Plugin { // TODO look at extending CordovaPlugin instead...

    public AllJoyn() {
        create();
    }

    @Override
    protected void finalize() throws Throwable {
        destroy();
    }

    public PluginResult execute(String action, JSONArray args, String callbackId) {
        execute(action, args.toString(), callbackId);
        PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
        result.setKeepCallback(true);
        return result;
    }

    public boolean isSynch(String action) {
        return false;
    }

    static {
        System.loadLibrary("npalljoyn");
    }

    private long handle;

    private String getKeyStoreFilename() {
        return ctx.getContext().getFileStreamPath("alljoyn_keystore").getAbsolutePath();
    }
    private native void create();
    private synchronized native void destroy();
    private native void execute(String action, String args, String callbackId);
}
