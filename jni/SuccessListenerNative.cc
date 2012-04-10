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
#include "SuccessListenerNative.h"

#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

SuccessListenerNative::SuccessListenerNative(Plugin& plugin, NPObject* objectValue)
    : NativeObject(plugin, objectValue)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

SuccessListenerNative::~SuccessListenerNative()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

void SuccessListenerNative::onSuccess()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    NPVariant result = NPVARIANT_VOID;
    NPN_InvokeDefault(plugin->npp, objectValue, 0, 0, &result);
    NPN_ReleaseVariantValue(&result);
}

