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
#ifndef _PLUGINDATA_H
#define _PLUGINDATA_H

#include "BusNamespace.h"
#include "Plugin.h"
#include "Status.h"
#include <qcc/Event.h>
#include <qcc/Mutex.h>
#include <qcc/StringMapKey.h>
#include <list>
#include <map>
class NativeObject;

class PluginData {
  public:
    class CallbackContext {
      public:
        Plugin plugin;
        CallbackContext(Plugin& plugin) : plugin(plugin) { }
        virtual ~CallbackContext() { }
        virtual void Destroy() = 0;
    };
    class AsyncCallbackContext : public CallbackContext {
      public:
        AsyncCallbackContext(Plugin& plugin) : CallbackContext(plugin) { }
        virtual ~AsyncCallbackContext() { }
        virtual void Destroy();
    };
    class SyncCallbackContext : public CallbackContext {
      public:
        QStatus status;
        qcc::Event event;
        SyncCallbackContext(Plugin& plugin) : CallbackContext(plugin), status(ER_ALERTED_THREAD) { }
        virtual ~SyncCallbackContext() { }
        virtual void Destroy();
    };
    typedef void (*Callback)(CallbackContext* context);
    static void DispatchCallback(Plugin& plugin, Callback callback, CallbackContext* context);
    static void CancelCallback(Plugin& plugin, Callback callback, CallbackContext* context);
    static bool StrictEquals(Plugin& plugin, const NPVariant& a, const NPVariant& b);

    static QStatus PermissionLevel(Plugin& plugin, const qcc::String& feature, int32_t& level);
    static QStatus SetPermissionLevel(Plugin& plugin, const qcc::String& feature, int32_t level, bool remember);

    /*
     * The static data relies on the library being unloaded (via NP_Shutdown) before NP_Initialize is
     * called again.  That assumption is not true under Android.
     */
    static void InitializeStaticData();

    /*
     * For debugging purposes, a list of "alive" plugin-allocated NPObjects is stored.  This lets me
     * see what NPObjects are still alive after NP_Shutdown (and thus will crash the process
     * containing the plugin when deallocate is called).
     */
    static void InsertNPObject(NPObject* npobj);
    static void RemoveNPObject(NPObject* npobj);
    static void DumpNPObjects();

    PluginData(Plugin& plugin);
    ~PluginData();
    Plugin& GetPlugin();
    NPObject* GetScriptableObject();

  private:
    static qcc::Mutex lock;

    class PendingCallback {
      public:
        NPP npp;
        Callback callback;
        CallbackContext* context;
        uintptr_t key;
        PendingCallback(NPP npp, Callback callback, CallbackContext* context, uintptr_t key)
            : npp(npp), callback(callback), context(context), key(key) { }
        PendingCallback()
            : npp(0), callback(0), context(0), key(0) { }
    };
    static std::list<PendingCallback> pendingCallbacks;
    static uintptr_t nextPendingCallbackKey;
    static void AsyncCall(void* key);

    static std::list<NPObject*> npobjects;

    /**
     * Map of "org.alljoyn.bus" permission levels per security origin.
     *
     * The value is written to persistent storage if the user says to remember the setting.
     */
    static std::map<qcc::StringMapKey, int32_t> permissionLevels;

    Plugin plugin;
    BusNamespace busNamespace;
};

#endif
