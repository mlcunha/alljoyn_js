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
#include "Plugin.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>
#include <qcc/Util.h>
#include <assert.h>
#include <string.h>

#define QCC_MODULE "ALLJOYN_JS"

_Plugin::_Plugin(NPP npp)
    : npp(npp)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

_Plugin::_Plugin()
    : npp(0)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

_Plugin::~_Plugin()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

qcc::String _Plugin::ToFilename(const qcc::String& in)
{
    qcc::String url = in;
    QCC_DbgPrintf(("unencoded url=%s", url.c_str()));
    for (size_t i = 0; i < url.size(); ++i) {
        switch (url[i]) {
        case '$':
        case '-':
        case '_':
        case '.':
        case '+':
        case '!':
        case '*':
        case '\'':
        case '(':
        case ')':
        case ',':
        case ';':
        case '/':
        case '?':
        case ':':
        case '@':
        case '=':
        case '&': {
            char encoded[3];
            snprintf(encoded, 3, "%02X", url[i]);
            url[i] = '%';
            url.insert(i + 1, encoded, 2);
            i += 2;
            break;
        }

        default:
            /* Do nothing */
            break;
        }
    }
    QCC_DbgPrintf(("encoded url=%s", url.c_str()));
    return url;
}

bool _Plugin::RaiseBusError(QStatus code, const char* message)
{
    _error.name = "BusError";
    _error.message = message;
    _error.code = code;
    QCC_LogError(_error.code, ("%s: %s", _error.name.c_str(), _error.message.c_str()));
    return false;
}

bool _Plugin::RaiseTypeError(const char* message)
{
    _error.name = "TypeError";
    _error.message = message;
    QCC_LogError(_error.code, ("%s: %s", _error.name.c_str(), _error.message.c_str()));
    return false;
}

void _Plugin::CheckError(NPObject* npobj)
{
    if (!_error.name.empty()) {
        error = _error;
        _error.Clear();
        NPN_SetException(npobj, error.name.c_str());
    }
}
