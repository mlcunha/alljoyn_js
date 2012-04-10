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
#include "npn.h"

#include "PluginData.h"
#include "Status.h"
#include <qcc/Debug.h>
#include <qcc/Log.h>
#include <assert.h>

#define QCC_MODULE "ALLJOYN_JS"

NPNetscapeFuncs* npn;
#if defined(QCC_OS_ANDROID)
JavaVM* gVM;
#endif
#if defined(QCC_OS_WINDOWS)
HINSTANCE gHinstance;
#endif

#if defined (QCC_OS_ANDROID)
/*
 * Android (at least in Froyo) has a bug in JavaBridge.cpp where it attaches external threads to the
 * JVM and does not detach them.  This causes a VM abort on thread exit.
 *
 * The only time an external thread calls into the browser in this plugin is when scheduling async
 * calls, so include a workaround here for the JavaBridge.cpp bug.
 */
void NPN_PluginThreadAsyncCall(NPP npp, void (*func)(void*), void* userData)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    JNIEnv* env;
    jint jniError = gVM->GetEnv((void** )&env, JNI_VERSION_1_4);
    if (JNI_EDETACHED == jniError) {
        jint ret = gVM->AttachCurrentThread(&env, 0);
        assert(0 == ret);       /* Assert fail in debug builds since this prevents correct behavior. */
        if (0 != ret) {
            QCC_LogError(ER_FAIL, ("AttachCurrentThread failed, no async call will be made"));
            return;
        }
    }
    npn->pluginthreadasynccall(npp, func, userData);
    if (JNI_EDETACHED == jniError) {
        gVM->DetachCurrentThread();
    }
}
#else
void NPN_PluginThreadAsyncCall(NPP npp, void (*func)(void*), void* userData)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    npn->pluginthreadasynccall(npp, func, userData);
}
#endif

/*
 * The other NPN_ functions are defined here to provide an entrypoint for debugging during
 * development.
 */
qcc::Thread* gPluginThread = NULL;
#define ASSERT_MAIN_THREAD()                                            \
    do {                                                                \
        assert(gPluginThread == qcc::Thread::GetThread());              \
        if (gPluginThread != qcc::Thread::GetThread()) {                \
            QCC_LogError(ER_FAIL, ("NPN function called from external thread!")); \
        }                                                               \
    } while (0)
#define ASSERT_NPP()                                    \
    do {                                                \
        assert(npp);                                    \
        if (!npp) {                                     \
            QCC_LogError(ER_FAIL, ("Null npp!"));       \
        }                                               \
    } while (0)

NPObject* NPN_CreateObject(NPP npp, NPClass* aClass)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->createobject(npp, aClass);
}

bool NPN_Enumerate(NPP npp, NPObject* obj, NPIdentifier** identifier, uint32_t* count)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->enumerate(npp, obj, identifier, count);
}

bool NPN_Evaluate(NPP npp, NPObject* obj, NPString* script, NPVariant* result)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->evaluate(npp, obj, script, result);
}

NPIdentifier NPN_GetIntIdentifier(int32_t intid)
{
    ASSERT_MAIN_THREAD();
    return npn->getintidentifier(intid);
}

bool NPN_GetProperty(NPP npp, NPObject* obj, NPIdentifier propertyName, NPVariant* result)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->getproperty(npp, obj, propertyName, result);
}

NPIdentifier NPN_GetStringIdentifier(const NPUTF8* name)
{
    ASSERT_MAIN_THREAD();
    return npn->getstringidentifier(name);
}

NPError NPN_GetValue(NPP npp, NPNVariable variable, void* ret_value)
{
    ASSERT_MAIN_THREAD();
    return npn->getvalue(npp, variable, ret_value);
}

bool NPN_HasMethod(NPP npp, NPObject* obj, NPIdentifier propertyName)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->hasmethod(npp, obj, propertyName);
}

bool NPN_IdentifierIsString(NPIdentifier identifier)
{
    ASSERT_MAIN_THREAD();
    return npn->identifierisstring(identifier);
}

int32_t NPN_IntFromIdentifier(NPIdentifier identifier)
{
    ASSERT_MAIN_THREAD();
    return npn->intfromidentifier(identifier);
}

bool NPN_Invoke(NPP npp, NPObject* obj, NPIdentifier methodName, const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->invoke(npp, obj, methodName, args, argCount, result);
}

bool NPN_InvokeDefault(NPP npp, NPObject* obj, const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->invokeDefault(npp, obj, args, argCount, result);
}

void* NPN_MemAlloc(uint32_t size)
{
    ASSERT_MAIN_THREAD();
    return npn->memalloc(size);
}

void NPN_MemFree(void* ptr)
{
    ASSERT_MAIN_THREAD();
    return npn->memfree(ptr);
}

void NPN_ReleaseObject(NPObject* obj)
{
    ASSERT_MAIN_THREAD();
    return npn->releaseobject(obj);
}

void NPN_ReleaseVariantValue(NPVariant* variant)
{
    ASSERT_MAIN_THREAD();
    return npn->releasevariantvalue(variant);
}

NPObject* NPN_RetainObject(NPObject* obj)
{
    ASSERT_MAIN_THREAD();
    return npn->retainobject(obj);
}

void NPN_SetException(NPObject* obj, const NPUTF8* message)
{
    ASSERT_MAIN_THREAD();
    return npn->setexception(obj, message);
}

bool NPN_SetProperty(NPP npp, NPObject* obj, NPIdentifier propertyName, const NPVariant* value)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->setproperty(npp, obj, propertyName, value);
}

NPUTF8* NPN_UTF8FromIdentifier(NPIdentifier identifier)
{
    ASSERT_MAIN_THREAD();
    return npn->utf8fromidentifier(identifier);
}

NPError NPN_GetURLNotify(NPP npp, const char* url, const char* target, void* notifyData)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->geturlnotify(npp, url, target, notifyData);
}

const char* NPN_UserAgent(NPP npp)
{
    ASSERT_MAIN_THREAD();
    ASSERT_NPP();
    return npn->uagent(npp);
}
