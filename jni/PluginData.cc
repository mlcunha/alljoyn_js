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

static void _DestroyOnMainThread(PluginData::CallbackContext*) {
}

PluginData::_Callback::_Callback(Plugin& plugin, void(*callback)(CallbackContext*))
    : callback(callback)
    , context(0)
    , plugin(plugin)
    , key(0)
{
}

PluginData::_Callback::_Callback()
    : callback(0)
    , context(0)
    , key(0)
{
}

PluginData::_Callback::~_Callback()
{
    if (gPluginThread == qcc::Thread::GetThread()) {
        delete context;
    } else {
        PluginData::DestroyOnMainThread(plugin, context);
    }
}

void PluginData::_Callback::SetEvent()
{
    if (!context->event.IsSet()) {
        QStatus setStatus = context->event.SetEvent();
        setStatus = setStatus; /* Fix compiler warning in release builds. */
        assert(ER_OK == setStatus);
        if (ER_OK != setStatus) {
            QCC_LogError(setStatus, ("SetEvent failed"));
        }
    }
}

std::list<PluginData::Callback> PluginData::pendingCallbacks;
uintptr_t PluginData::nextPendingCallbackKey = 1;
qcc::Mutex PluginData::lock;

void PluginData::DispatchCallback(PluginData::Callback& callback)
{
    if (callback->plugin->npp) {
        lock.Lock();
        callback->key = nextPendingCallbackKey;
        if (++nextPendingCallbackKey == 0) {
            ++nextPendingCallbackKey;
        }
        NPN_PluginThreadAsyncCall(callback->plugin->npp, PluginData::AsyncCall, (void*)callback->key);
        pendingCallbacks.push_back(callback);
        lock.Unlock();
    }
}

void PluginData::DestroyOnMainThread(Plugin& plugin, PluginData::CallbackContext* context)
{
    lock.Lock();
    if (plugin->npp) {
        PluginData::Callback callback(plugin, _DestroyOnMainThread);
        callback->context = context;
        callback->key = nextPendingCallbackKey;
        if (++nextPendingCallbackKey == 0) {
            ++nextPendingCallbackKey;
        }
        NPN_PluginThreadAsyncCall(callback->plugin->npp, PluginData::AsyncCall, (void*)callback->key);
        pendingCallbacks.push_back(callback);
    } else {
        /*
         * It is not safe to release NPAPI resources from outside the main thread.  So this
         * could lead to a crash if called, or a memory leak if not called.  Prefer the memory
         * leak.
         */
        QCC_LogError(ER_NONE, ("Leaking callback context"));
    }
    lock.Unlock();
}

void PluginData::CancelCallback(PluginData::Callback& callback)
{
    lock.Lock();
    if (callback->plugin->npp) {
        for (std::list<Callback>::iterator it = pendingCallbacks.begin(); it != pendingCallbacks.end(); ++it) {
            if (((*it)->plugin->npp == callback->plugin->npp) && ((*it)->callback == callback->callback) && ((*it)->context == callback->context)) {
                pendingCallbacks.erase(it);
                break;
            }
        }
    }
    lock.Unlock();
}

void PluginData::AsyncCall(void* key)
{
    Callback callback;
    lock.Lock();
    for (std::list<Callback>::iterator it = pendingCallbacks.begin(); it != pendingCallbacks.end(); ++it) {
        if ((*it)->key == (uintptr_t)key) {
            callback = *it;
            pendingCallbacks.erase(it);
            break;
        }
    }
    lock.Unlock();
    if (callback->callback) {
        callback->callback(callback->context);
        callback->SetEvent();
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

    for (std::list<Callback>::iterator it = pendingCallbacks.begin(); it != pendingCallbacks.end();) {
        if (plugin.iden((*it)->plugin)) {
            Callback callback = *it;
            callback->SetEvent();
            pendingCallbacks.erase(it);
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
