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
#include "VersionHost.h"

#include "npn.h"
#include "TypeMapping.h"
#include <alljoyn/version.h>
#include <qcc/Debug.h>
#include <string.h>

#define QCC_MODULE "ALLJOYN_JS"

_VersionHost::_VersionHost(Plugin& plugin)
    : ScriptableObject(plugin)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ATTRIBUTE("buildInfo", &_VersionHost::getBuildInfo, 0);
    ATTRIBUTE("version", &_VersionHost::getVersion, 0);
    ATTRIBUTE("arch", &_VersionHost::getArch, 0);
    ATTRIBUTE("apiLevel", &_VersionHost::getApiLevel, 0);
    ATTRIBUTE("release", &_VersionHost::getRelease, 0);

    OPERATION("toString", &_VersionHost::toString);
}

_VersionHost::~_VersionHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _VersionHost::getBuildInfo(NPVariant* result)
{
    ToDOMString(plugin, ajn::GetBuildInfo(), strlen(ajn::GetBuildInfo()), *result);
    return true;
}

bool _VersionHost::getVersion(NPVariant* result)
{
    ToUnsignedLong(plugin, ajn::GetNumericVersion(), *result);
    return true;
}

bool _VersionHost::getArch(NPVariant* result)
{
    ToUnsignedLong(plugin, GetVersionArch(ajn::GetNumericVersion()), *result);
    return true;
}

bool _VersionHost::getApiLevel(NPVariant* result)
{
    ToUnsignedLong(plugin, GetVersionAPILevel(ajn::GetNumericVersion()), *result);
    return true;
}

bool _VersionHost::getRelease(NPVariant* result)
{
    ToUnsignedLong(plugin, GetVersionRelease(ajn::GetNumericVersion()), *result);
    return true;
}

bool _VersionHost::toString(const NPVariant* args, uint32_t npargCount, NPVariant* result)
{
    ToDOMString(plugin, ajn::GetVersion(), strlen(ajn::GetVersion()), *result);
    return true;
}
