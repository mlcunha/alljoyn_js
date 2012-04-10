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
#include "ScriptableObject.h"

#include "NativeObject.h"
#include "npn.h"
#include <assert.h>
#include <qcc/Debug.h>
#include <string.h>

#define QCC_MODULE "ALLJOYN_JS"

#define CALL_MEMBER(o, m) ((*o).*(m))

std::map<NPIdentifier, int32_t> ScriptableObject::noConstants;

ScriptableObject::ScriptableObject(Plugin& plugin)
    : plugin(plugin)
    , getter(0)
    , setter(0)
    , deleter(0)
    , enumerator(0)
    , caller(0)
    , constants(noConstants)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

ScriptableObject::ScriptableObject(Plugin& plugin, std::map<NPIdentifier, int32_t>& constants)
    : plugin(plugin)
    , getter(0)
    , setter(0)
    , deleter(0)
    , enumerator(0)
    , caller(0)
    , constants(constants)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

ScriptableObject::~ScriptableObject()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void ScriptableObject::Invalidate()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool ScriptableObject::HasMethod(NPIdentifier name)
{
#if !defined(NDEBUG)
    NPUTF8* nm = NPN_UTF8FromIdentifier(name);
    QCC_DbgTrace(("%s(name=%s)", __FUNCTION__, nm));
    NPN_MemFree(nm);
#endif
    std::map<NPIdentifier, Operation>::iterator it = operations.find(name);
    return (it != operations.end());
}

bool ScriptableObject::Invoke(NPIdentifier name, const NPVariant* args, uint32_t argCount, NPVariant* result)
{
#if !defined(NDEBUG)
    NPUTF8* nm = NPN_UTF8FromIdentifier(name);
    QCC_DbgTrace(("%s(name=%s)", __FUNCTION__, nm));
    NPN_MemFree(nm);
#endif
    std::map<NPIdentifier, Operation>::iterator it = operations.find(name);
    if (it != operations.end()) {
        assert(it->second.call);
        return CALL_MEMBER(this, it->second.call) (args, argCount, result);
    }
    return false;
}

bool ScriptableObject::InvokeDefault(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    if (caller) {
        return CALL_MEMBER(this, caller) (args, argCount, result);
    }
    return false;
}

bool ScriptableObject::HasProperty(NPIdentifier name)
{
#if !defined(NDEBUG)
    if (NPN_IdentifierIsString(name)) {
        NPUTF8* nm = NPN_UTF8FromIdentifier(name);
        QCC_DbgTrace(("%s(name=%s)", __FUNCTION__, nm));
        NPN_MemFree(nm);
    } else {
        QCC_DbgTrace(("%s(name=%d)", __FUNCTION__, NPN_IntFromIdentifier(name)));
    }
#endif
    std::map<NPIdentifier, int32_t>::iterator cit = constants.find(name);
    if (cit != constants.end()) {
        return true;
    }
    std::map<NPIdentifier, Attribute>::iterator ait = attributes.find(name);
    return (ait != attributes.end());
}

bool ScriptableObject::GetProperty(NPIdentifier name, NPVariant* result)
{
#if !defined(NDEBUG)
    if (NPN_IdentifierIsString(name)) {
        NPUTF8* nm = NPN_UTF8FromIdentifier(name);
        QCC_DbgTrace(("%s(name=%s)", __FUNCTION__, nm));
        NPN_MemFree(nm);
    } else {
        QCC_DbgTrace(("%s(name=%d)", __FUNCTION__, NPN_IntFromIdentifier(name)));
    }
#endif
    std::map<NPIdentifier, int32_t>::iterator cit = constants.find(name);
    if (cit != constants.end()) {
        INT32_TO_NPVARIANT(cit->second, *result);
        return true;
    }
    std::map<NPIdentifier, Attribute>::iterator ait = attributes.find(name);
    if (ait != attributes.end()) {
        assert(ait->second.get);
        return CALL_MEMBER(this, ait->second.get) (result);
    }
    if (getter) {
        return CALL_MEMBER(this, getter) (name, result);
    }
    return false;
}

bool ScriptableObject::SetProperty(NPIdentifier name, const NPVariant* value)
{
#if !defined(NDEBUG)
    if (NPN_IdentifierIsString(name)) {
        NPUTF8* nm = NPN_UTF8FromIdentifier(name);
        QCC_DbgTrace(("%s(name=%s)", __FUNCTION__, nm));
        NPN_MemFree(nm);
    } else {
        QCC_DbgTrace(("%s(name=%d)", __FUNCTION__, NPN_IntFromIdentifier(name)));
    }
#endif
    /*
     * Workaround for WebKit browsers.  "delete obj.property" doesn't call RemoveProperty, so allow
     * "obj.property = undefined" to do the same thing.
     */
    if (NPVARIANT_IS_VOID(*value)) {
        return RemoveProperty(name);
    }

    std::map<NPIdentifier, Attribute>::iterator it = attributes.find(name);
    if ((it != attributes.end()) && it->second.set) {
        return CALL_MEMBER(this, it->second.set) (value);
    }
    if (setter) {
        return CALL_MEMBER(this, setter) (name, value);
    }
    return false;
}

bool ScriptableObject::RemoveProperty(NPIdentifier name)
{
#if !defined(NDEBUG)
    if (NPN_IdentifierIsString(name)) {
        NPUTF8* nm = NPN_UTF8FromIdentifier(name);
        QCC_DbgTrace(("%s(name=%s)", __FUNCTION__, nm));
        NPN_MemFree(nm);
    } else {
        QCC_DbgTrace(("%s(name=%d)", __FUNCTION__, NPN_IntFromIdentifier(name)));
    }
#endif
    if (deleter) {
        return CALL_MEMBER(this, deleter) (name);
    }
    return false;
}

bool ScriptableObject::Enumerate(NPIdentifier** value, uint32_t* count)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    *value = 0;
    *count = 0;

    NPIdentifier* enumeratorValue = 0;
    uint32_t enumeratorCount = 0;
    if (enumerator) {
        CALL_MEMBER(this, enumerator) (&enumeratorValue, &enumeratorCount);
    }
    *count = enumeratorCount + constants.size() + attributes.size() + operations.size();
    if (*count) {
        *value = reinterpret_cast<NPIdentifier*>(NPN_MemAlloc(*count * sizeof(NPIdentifier)));
        NPIdentifier* v = *value;
        for (uint32_t i = 0; i < enumeratorCount; ++i) {
            *v++ = enumeratorValue[i];
        }
        if (enumeratorValue) {
            NPN_MemFree(enumeratorValue);
        }
        for (std::map<NPIdentifier, int32_t>::iterator it = constants.begin(); it != constants.end(); ++it) {
            *v++ = it->first;
        }
        for (std::map<NPIdentifier, Attribute>::iterator it = attributes.begin(); it != attributes.end(); ++it) {
            *v++ = it->first;
        }
        for (std::map<NPIdentifier, Operation>::iterator it = operations.begin(); it != operations.end(); ++it) {
            *v++ = it->first;
        }
    }
    return true;
}

bool ScriptableObject::Construct(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    return false;
}
