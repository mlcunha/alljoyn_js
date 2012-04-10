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
#include "SessionOptsHost.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"


_SessionOptsHost::_SessionOptsHost(Plugin& plugin, const ajn::SessionOpts& opts)
    : ScriptableObject(plugin, _SessionOptsInterface::Constants())
    , opts(opts)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ATTRIBUTE("traffic", &_SessionOptsHost::getTraffic, 0);
    ATTRIBUTE("isMultipoint", &_SessionOptsHost::getIsMultipoint, 0);
    ATTRIBUTE("proximity", &_SessionOptsHost::getProximity, 0);
    ATTRIBUTE("transports", &_SessionOptsHost::getTransports, 0);
}

_SessionOptsHost::~_SessionOptsHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _SessionOptsHost::getTraffic(NPVariant* result)
{
    ToOctet(plugin, opts.traffic, *result);
    return true;
}

bool _SessionOptsHost::getIsMultipoint(NPVariant* result)
{
    ToBoolean(plugin, opts.isMultipoint, *result);
    return true;
}

bool _SessionOptsHost::getProximity(NPVariant* result)
{
    ToOctet(plugin, opts.proximity, *result);
    return true;
}

bool _SessionOptsHost::getTransports(NPVariant* result)
{
    ToUnsignedShort(plugin, opts.transports, *result);
    return true;
}

