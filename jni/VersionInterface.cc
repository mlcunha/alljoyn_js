/*
 * Copyright 2011-2013, Qualcomm Innovation Center, Inc.
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

#include "npn.h"
#include "TypeMapping.h"
#include <alljoyn/version.h>
#include <qcc/Debug.h>
#include <string.h>

#define QCC_MODULE "ALLJOYN_JS"

_VersionInterface::_VersionInterface(Plugin& plugin)
    : ScriptableObject(plugin)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ATTRIBUTE("buildInfo", &_VersionInterface::getBuildInfo, 0);
    ATTRIBUTE("numericVersion", &_VersionInterface::getNumericVersion, 0);
    ATTRIBUTE("arch", &_VersionInterface::getArch, 0);
    ATTRIBUTE("apiLevel", &_VersionInterface::getApiLevel, 0);
    ATTRIBUTE("release", &_VersionInterface::getRelease, 0);
    ATTRIBUTE("version", &_VersionInterface::getVersion, 0);
}

_VersionInterface::~_VersionInterface()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _VersionInterface::getBuildInfo(NPVariant* result)
{
    ToDOMString(plugin, ajn::GetBuildInfo(), strlen(ajn::GetBuildInfo()), *result);
    return true;
}

bool _VersionInterface::getNumericVersion(NPVariant* result)
{
    ToUnsignedLong(plugin, ajn::GetNumericVersion(), *result);
    return true;
}

bool _VersionInterface::getArch(NPVariant* result)
{
    ToUnsignedLong(plugin, GetVersionArch(ajn::GetNumericVersion()), *result);
    return true;
}

bool _VersionInterface::getApiLevel(NPVariant* result)
{
    ToUnsignedLong(plugin, GetVersionAPILevel(ajn::GetNumericVersion()), *result);
    return true;
}

bool _VersionInterface::getRelease(NPVariant* result)
{
    ToUnsignedLong(plugin, GetVersionRelease(ajn::GetNumericVersion()), *result);
    return true;
}

bool _VersionInterface::getVersion(NPVariant* result)
{
    ToDOMString(plugin, ajn::GetVersion(), strlen(ajn::GetVersion()), *result);
    return true;
}
