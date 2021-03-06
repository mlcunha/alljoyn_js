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
#include "SessionMemberAddedListenerNative.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

SessionMemberAddedListenerNative::SessionMemberAddedListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

SessionMemberAddedListenerNative::~SessionMemberAddedListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void SessionMemberAddedListenerNative::onMemberAdded(ajn::SessionId id, const qcc::String& uniqueName)
{
    QCC_DbgTrace(("%s(id=%u,uniqueName=%s)", __FUNCTION__, id, uniqueName.c_str()));

    NPVariant npargs[2];
    ToUnsignedLong(plugin, id, npargs[0]);
    ToDOMString(plugin, uniqueName, npargs[1]);

    NPVariant result = NPVARIANT_VOID;
    NPN_InvokeDefault(plugin->npp, objectValue, npargs, 2, &result);
    NPN_ReleaseVariantValue(&result);
}
