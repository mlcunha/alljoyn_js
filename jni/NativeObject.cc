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
#include "NativeObject.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

NativeObject::NativeObject(Plugin& plugin, NPObject* objectValue)
    : plugin(plugin)
    , objectValue(NPN_RetainObject(objectValue))
{
    QCC_DbgTrace(("%s(objectValue=%p)", __FUNCTION__, objectValue));
    plugin->nativeObjects[this] = objectValue;
}

NativeObject::NativeObject(Plugin& plugin)
    : plugin(plugin)
    , objectValue(0)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    NPVariant variant = NPVARIANT_VOID;
    if (NewObject(plugin, variant)) {
        objectValue = NPVARIANT_TO_OBJECT(variant);
        plugin->nativeObjects[this] = objectValue;
    } else {
        NPN_ReleaseVariantValue(&variant);
    }
}

NativeObject::~NativeObject()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    plugin->nativeObjects.erase(this);
    Invalidate();
}

void NativeObject::Invalidate()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    if (objectValue) {
        NPN_ReleaseObject(objectValue);
        objectValue = 0;
    }
}

bool NativeObject::operator==(const NativeObject& that) const
{
    NPVariant a, b;
    OBJECT_TO_NPVARIANT(objectValue, a);
    OBJECT_TO_NPVARIANT(that.objectValue, b);
    return plugin->StrictEquals(a, b);
}
