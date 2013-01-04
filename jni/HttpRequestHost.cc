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
#include "HttpRequestHost.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>
#include <qcc/time.h>

#define QCC_MODULE "ALLJOYN_JS"

_HttpRequestHost::_HttpRequestHost(Plugin& plugin, HttpServer& httpServer, Http::Headers& requestHeaders, qcc::SocketStream& stream, qcc::SocketFd sessionFd)
    : ScriptableObject(plugin)
    , httpServer(httpServer)
    , requestHeaders(requestHeaders)
    , stream(stream)
    , sessionFd(sessionFd)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    /* Default response */
    status = 200;
    statusText = "OK";
    responseHeaders["Date"] = qcc::UTCTime();
    responseHeaders["Content-Type"] = "application/octet-stream";

    ATTRIBUTE("status", &_HttpRequestHost::getStatus, &_HttpRequestHost::setStatus);
    ATTRIBUTE("statusText", &_HttpRequestHost::getStatusText, &_HttpRequestHost::setStatusText);

    OPERATION("getAllRequestHeaders", &_HttpRequestHost::getAllRequestHeaders);
    OPERATION("getRequestHeader", &_HttpRequestHost::getRequestHeader);
    OPERATION("setResponseHeader", &_HttpRequestHost::setResponseHeader);
    OPERATION("send", &_HttpRequestHost::send);
}

_HttpRequestHost::~_HttpRequestHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _HttpRequestHost::getStatus(NPVariant* result)
{
    ToUnsignedShort(plugin, status, *result);
    return true;
}

bool _HttpRequestHost::setStatus(const NPVariant* value)
{
    bool typeError = false;
    status = ToUnsignedShort(plugin, *value, typeError);
    return !typeError;
}

bool _HttpRequestHost::getStatusText(NPVariant* result)
{
    ToDOMString(plugin, statusText, *result);
    return true;
}

bool _HttpRequestHost::setStatusText(const NPVariant* value)
{
    bool typeError = false;
    statusText = ToDOMString(plugin, *value, typeError);
    return !typeError;
}

bool _HttpRequestHost::getAllRequestHeaders(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    qcc::String headers;
    for (Http::Headers::iterator it = requestHeaders.begin(); it != requestHeaders.end(); ++it) {
        headers += it->first + ": " + it->second + "\r\n";
    }
    ToDOMString(plugin, headers, *result);
    return true;
}

bool _HttpRequestHost::getRequestHeader(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    qcc::String header;
    qcc::String value;
    Http::Headers::iterator it;

    bool typeError = false;
    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    header = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }

    it = requestHeaders.find(header); // TODO should be case-insensitive
    if (it != requestHeaders.end()) {
        value = it->second;
    }

exit:
    ToDOMString(plugin, value, *result, TreatEmptyStringAsNull);
    return !typeError;
}

bool _HttpRequestHost::setResponseHeader(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    qcc::String header;
    qcc::String value;

    bool typeError = false;
    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    header = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    value = ToDOMString(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("%s: %s", header.c_str(), value.c_str()));

    responseHeaders[header] = value;

exit:
    VOID_TO_NPVARIANT(*result);
    return !typeError;
}

bool _HttpRequestHost::send(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    httpServer->SendResponse(stream, status, statusText, responseHeaders, sessionFd);
    return true;
}

