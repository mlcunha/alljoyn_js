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
#include "BusErrorHost.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

_BusErrorHost::_BusErrorHost(Plugin& plugin, const qcc::String& name, const qcc::String& message, QStatus code)
    : ScriptableObject(plugin, _BusErrorInterface::Constants())
    , name(name)
    , message(message)
    , code(code)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ATTRIBUTE("name", &_BusErrorHost::getName, 0);
    ATTRIBUTE("message", &_BusErrorHost::getMessage, 0);
    ATTRIBUTE("code", &_BusErrorHost::getCode, 0);

    OPERATION("toString", &_BusErrorHost::toString);
}

_BusErrorHost::_BusErrorHost(Plugin& plugin, QStatus code)
    : ScriptableObject(plugin, _BusErrorInterface::Constants())
    , code(code)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ATTRIBUTE("name", &_BusErrorHost::getName, 0);
    ATTRIBUTE("message", &_BusErrorHost::getMessage, 0);
    ATTRIBUTE("code", &_BusErrorHost::getCode, 0);

    OPERATION("toString", &_BusErrorHost::toString);
}

_BusErrorHost::~_BusErrorHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

qcc::String _BusErrorHost::ToString()
{
    qcc::String string;
    if (!name.empty()) {
        string += name + ": ";
    }
    if (!message.empty()) {
        string += message + " ";
    }
    string += qcc::String("(") + QCC_StatusText(code) + ")";
    return string;
}

bool _BusErrorHost::getName(NPVariant* result)
{
    ToDOMString(plugin, name, *result);
    return true;
}

bool _BusErrorHost::getMessage(NPVariant* result)
{
    ToDOMString(plugin, message, *result);
    return true;
}

bool _BusErrorHost::getCode(NPVariant* result)
{
    ToUnsignedShort(plugin, code, *result);
    return true;
}

bool _BusErrorHost::toString(const NPVariant* args, uint32_t npargCount, NPVariant* result)
{
    qcc::String str = "[" + ToString() + "]";
    ToDOMString(plugin, str, *result);
    return true;
}
