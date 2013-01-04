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
#include "SocketFdInterface.h"

#include "CallbackNative.h"
#include "HttpListenerNative.h"
#include "SocketFdHost.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

_SocketFdInterface::_SocketFdInterface(Plugin& plugin)
    : ScriptableObject(plugin)
    , httpServer(plugin)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    OPERATION("createObjectURL", &_SocketFdInterface::createObjectURL);
    OPERATION("revokeObjectURL", &_SocketFdInterface::revokeObjectURL);
}

_SocketFdInterface::~_SocketFdInterface()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _SocketFdInterface::Construct(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    bool typeError = false;
    qcc::String fd;
    const char* nptr;
    char* endptr;
    qcc::SocketFd socketFd;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    fd = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    nptr = fd.c_str();
    socketFd = strtoll(nptr, &endptr, 0);
    typeError = (endptr == nptr);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a socket descriptor");
        goto exit;
    }
    if (qcc::INVALID_SOCKET_FD != socketFd) {
        status = qcc::SocketDup(socketFd, socketFd);
        if (ER_OK != status) {
            QCC_LogError(status, ("SocketDup failed"));
            goto exit;
        }
    }

    {
        SocketFdHost socketFdHost(plugin, socketFd);
        ToHostObject<SocketFdHost>(plugin, socketFdHost, *result);
    }

exit:
    if ((ER_OK == status) && !typeError) {
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

bool _SocketFdInterface::createObjectURL(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    bool typeError = false;
    SocketFdHost* socketFd = 0;
    CallbackNative* callbackNative = 0;
    HttpListenerNative* httpListener = 0;
    qcc::String url;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    socketFd = ToHostObject<SocketFdHost>(plugin, args[0], typeError);
    if (typeError || !socketFd) {
        plugin->RaiseTypeError("argument 0 is not a SocketFd");
        goto exit;
    }
    if (argCount > 2) {
        httpListener = ToNativeObject<HttpListenerNative>(plugin, args[1], typeError);
        if (typeError || !httpListener) {
            plugin->RaiseTypeError("argument 1 is not an object");
            goto exit;
        }
    }
    callbackNative = ToNativeObject<CallbackNative>(plugin, args[argCount - 1], typeError);
    if (typeError || !callbackNative) {
        typeError = true;
        plugin->RaiseTypeError("argument 2 is not an object");
        goto exit;
    }

    status = httpServer->CreateObjectUrl((*socketFd)->GetFd(), httpListener, url);
    if (ER_OK == status) {
        httpListener = 0; /* httpServer now owns httpListener */
        QCC_DbgTrace(("url=%s", url.c_str()));
    }

exit:
    if (!typeError && callbackNative) {
        CallbackNative::DispatchCallback(plugin, callbackNative, status, url);
        callbackNative = 0;
    }
    delete callbackNative;
    delete httpListener;
    VOID_TO_NPVARIANT(*result);
    return !typeError;
}

bool _SocketFdInterface::revokeObjectURL(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String url;
    CallbackNative* callbackNative = 0;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    url = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    callbackNative = ToNativeObject<CallbackNative>(plugin, args[1], typeError);
    if (typeError || !callbackNative) {
        typeError = true;
        plugin->RaiseTypeError("argument 1 is not an object");
        goto exit;
    }
    QCC_DbgTrace(("url=%s", url.c_str()));

    httpServer->RevokeObjectUrl(url);

exit:
    if (!typeError && callbackNative) {
        CallbackNative::DispatchCallback(plugin, callbackNative, status);
        callbackNative = 0;
    }
    delete callbackNative;
    VOID_TO_NPVARIANT(*result);
    return !typeError;
}
