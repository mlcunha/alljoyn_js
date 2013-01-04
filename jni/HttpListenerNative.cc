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
#include "HttpListenerNative.h"

#include "HttpRequestHost.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

HttpListenerNative::HttpListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

HttpListenerNative::~HttpListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void HttpListenerNative::onRequest(HttpRequestHost& request)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    NPVariant nparg;
    ToHostObject<HttpRequestHost>(plugin, request, nparg);

    NPVariant result = NPVARIANT_VOID;
    if (!NPN_InvokeDefault(plugin->npp, objectValue, &nparg, 1, &result)) {
        QCC_LogError(ER_FAIL, ("NPN_InvokeDefault failed"));
    }

    NPN_ReleaseVariantValue(&result);
    NPN_ReleaseVariantValue(&nparg);
}
