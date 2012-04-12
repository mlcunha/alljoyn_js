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
#include "PluginData.h"

#include "BusNamespace.h"
#include "HostObject.h"
#include "NativeObject.h"
#include <assert.h>
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

class DestroyOnMainThread : public PluginData::AsyncCallbackContext {
  public:
    CallbackContext* context;
    DestroyOnMainThread(CallbackContext* context)
        : PluginData::AsyncCallbackContext(context->plugin)
        , context(context) { }
    static void _Destroy(PluginData::CallbackContext* ctx) {
        DestroyOnMainThread* context = static_cast<DestroyOnMainThread*>(ctx);
        delete context;
    }
};

void PluginData::AsyncCallbackContext::Destroy()
{
    if (gPluginThread == qcc::Thread::GetThread()) {
        delete this;
    } else {
        PluginData::DispatchCallback(plugin, DestroyOnMainThread::_Destroy, new DestroyOnMainThread(this));
    }
}

void PluginData::SyncCallbackContext::Destroy()
{
    if (!event.IsSet()) {
        QStatus setStatus = event.SetEvent();
        setStatus = setStatus; /* Fix compiler warning in release builds. */
        assert(ER_OK == setStatus);
        if (ER_OK != setStatus) {
            QCC_LogError(setStatus, ("SetEvent failed"));
        }
    }
}

std::list<PluginData::PendingCallback> PluginData::pendingCallbacks;
uintptr_t PluginData::nextPendingCallbackKey = 1;
qcc::Mutex PluginData::lock;

void PluginData::DispatchCallback(Plugin& plugin, PluginData::Callback callback, CallbackContext* context)
{
    NPP npp = 0;
    lock.Lock();
    npp = plugin->npp;
    if (plugin->npp) {
        NPN_PluginThreadAsyncCall(plugin->npp, PluginData::AsyncCall, (void*)nextPendingCallbackKey);
        pendingCallbacks.push_back(PendingCallback(plugin->npp, callback, context, nextPendingCallbackKey));
        if (++nextPendingCallbackKey == 0) {
            ++nextPendingCallbackKey;
        }
    }
    lock.Unlock();
    if (!npp) {
        if (gPluginThread == qcc::Thread::GetThread()) {
            context->Destroy();
        } else {
            /*
             * It is not safe to release NPAPI resources from outside the main thread.  So this
             * could lead to a crash if called, or a memory leak if not called.  Prefer the memory
             * leak.
             */
            QCC_LogError(ER_NONE, ("Leaking callback context"));
        }
    }
}

void PluginData::CancelCallback(Plugin& plugin, PluginData::Callback callback, CallbackContext* context)
{
    PendingCallback pendingCallback;
    lock.Lock();
    if (plugin->npp) {
        for (std::list<PendingCallback>::iterator it = pendingCallbacks.begin(); it != pendingCallbacks.end(); ++it) {
            if ((it->npp == plugin->npp) && (it->callback == callback) && (it->context == context)) {
                pendingCallback = *it;
                pendingCallbacks.erase(it);
                break;
            }
        }
    }
    lock.Unlock();
    if (pendingCallback.context) {
        pendingCallback.context->Destroy();
    }
}

void PluginData::AsyncCall(void* key)
{
    PendingCallback pendingCallback;
    lock.Lock();
    for (std::list<PendingCallback>::iterator it = pendingCallbacks.begin(); it != pendingCallbacks.end(); ++it) {
        if (it->key == (uintptr_t)key) {
            pendingCallback = *it;
            pendingCallbacks.erase(it);
            break;
        }
    }
    lock.Unlock();
    if (pendingCallback.callback) {
        pendingCallback.callback(pendingCallback.context);
        if (pendingCallback.context) {
            pendingCallback.context->Destroy();
        }
    }
}

std::list<NPObject*> PluginData::npobjects;

void PluginData::InsertNPObject(NPObject* npobj)
{
#if defined(NDEBUG)
    lock.Lock();
    npobjects.push_back(npobj);
    lock.Unlock();
#endif
}

void PluginData::RemoveNPObject(NPObject* npobj)
{
#if defined(NDEBUG)
    lock.Lock();
    npobjects.remove(npobj);
    lock.Unlock();
#endif
}

void PluginData::DumpNPObjects()
{
#if defined(NDEBUG)
    lock.Lock();
    std::list<NPObject*>::iterator it = npobjects.begin();
    if (it != npobjects.end()) {
        QCC_LogError(ER_NONE, ("Orphaned NPObjects"));
    }
    for (; it != npobjects.end(); ++it) {
        QCC_LogError(ER_NONE, ("%p", *it));
    }
    lock.Unlock();
#endif
}

PluginData::PluginData(Plugin& plugin)
    : plugin(plugin)
    , busNamespace(plugin)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

PluginData::~PluginData()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    lock.Lock();
    NPP npp = plugin->npp;
    plugin->npp = 0;
#if defined(QCC_OS_ANDROID)
    if (plugin->context) {
        JNIEnv* env;
        if (JNI_OK == gVM->GetEnv((void** )&env, JNI_VERSION_1_4)) {
            env->DeleteGlobalRef(plugin->securityClient);
            plugin->securityClient = 0;
            env->DeleteGlobalRef(plugin->context);
            plugin->context = 0;
        } else {
            QCC_LogError(ER_FAIL, ("GetEnv failed, leaking global refs"));
        }
    }
#endif
    /*
     * Clear out native object cache as Firefox will delete these regardless of the reference count
     * when destroying the plugin.
     */
    for (std::map<NativeObject*, NPObject*>::iterator it = plugin->nativeObjects.begin(); it != plugin->nativeObjects.end(); ++it) {
        if (it->second) {
            it->second = 0;
            it->first->Invalidate();
        }
    }

    for (std::list<PendingCallback>::iterator it = pendingCallbacks.begin(); it != pendingCallbacks.end();) {
        if (it->npp == npp) {
            CallbackContext* context = it->context;
            pendingCallbacks.erase(it);
            context->Destroy();
            /*
             * Can't make any assumptions about the contents of pendingCallbacks after the above
             * call, so reset the iterator.
             */
            it = pendingCallbacks.begin();
        } else {
            ++it;
        }
    }
    lock.Unlock();
}

NPObject* PluginData::GetScriptableObject()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    return HostObject<BusNamespace>::GetInstance(plugin, busNamespace);
}

Plugin& PluginData::GetPlugin()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    return plugin;
}

void PluginData::InitializeStaticData()
{
    permissionLevels.clear();
}
