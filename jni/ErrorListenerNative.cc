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
#include "ErrorListenerNative.h"

#include "BusErrorHost.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

ErrorListenerNative::ErrorListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

ErrorListenerNative::~ErrorListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void ErrorListenerNative::onError(BusErrorHost& error)
{
    QCC_DbgTrace(("%s(%s)", __FUNCTION__, error->ToString().c_str()));

    NPVariant nparg;
    ToHostObject<BusErrorHost>(plugin, error, nparg);

    NPVariant result = NPVARIANT_VOID;
    NPN_InvokeDefault(plugin->npp, objectValue, &nparg, 1, &result);

    NPN_ReleaseVariantValue(&nparg);
    NPN_ReleaseVariantValue(&result);
}
