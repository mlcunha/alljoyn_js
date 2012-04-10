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
#include "VersionInterface.h"

#include "HostObject.h"
#include "TypeMapping.h"
#include "VersionHost.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

_VersionInterface::_VersionInterface(Plugin& plugin)
    : ScriptableObject(plugin)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

_VersionInterface::~_VersionInterface()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _VersionInterface::Construct(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    VersionHost versionHost(plugin);
    ToHostObject<VersionHost>(plugin, versionHost, *result);
    return true;
}
