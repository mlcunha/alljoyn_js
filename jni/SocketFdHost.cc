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
#include "SocketFdHost.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>
#include <qcc/Socket.h>

#ifndef PRIi64
#define __STDC_FORMAT_MACROS
#include <inttypes.h>
#endif

#define QCC_MODULE "ALLJOYN_JS"

_SocketFdHost::_SocketFdHost(Plugin& plugin, qcc::SocketFd& socketFd)
    : ScriptableObject(plugin)
    , socketFd(socketFd)
{
    QCC_DbgTrace(("%s(socketFd=%d)", __FUNCTION__, socketFd));

    ATTRIBUTE("fd", &_SocketFdHost::getFd, 0);

    OPERATION("close", &_SocketFdHost::close);
    OPERATION("shutdown", &_SocketFdHost::shutdown);
    OPERATION("recv", &_SocketFdHost::recv);
    OPERATION("send", &_SocketFdHost::send);
}

_SocketFdHost::~_SocketFdHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    if (qcc::INVALID_SOCKET_FD != socketFd) {
        qcc::Close(socketFd);
    }
}

bool _SocketFdHost::getFd(NPVariant* result)
{
    char str[32];
    switch (sizeof(qcc::SocketFd)) {
    case 4:
        snprintf(str, 32, "%d", (int32_t)socketFd);
        break;

    case 8:
        snprintf(str, 32, "%" PRIi64, (int64_t)socketFd);
        break;
    }
    ToDOMString(plugin, str, strlen(str), *result);
    return true;
}

bool _SocketFdHost::close(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    if (qcc::INVALID_SOCKET_FD != socketFd) {
        qcc::Close(socketFd);
    }
    socketFd = qcc::INVALID_SOCKET_FD;
    VOID_TO_NPVARIANT(*result);
    return true;
}

bool _SocketFdHost::shutdown(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    ToUnsignedShort(plugin, qcc::Shutdown(socketFd), *result);
    return true;
}

bool _SocketFdHost::recv(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    NPVariant nplength = NPVARIANT_VOID;
    bool ignored;
    size_t length;
    uint8_t* buf = 0;
    size_t i;
    size_t received = 0;
    QStatus status = ER_OK;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    if (!NPVARIANT_IS_OBJECT(args[0]) ||
        !NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("length"), &nplength) ||
        !(NPVARIANT_IS_INT32(nplength) || NPVARIANT_IS_DOUBLE(nplength))) {
        plugin->RaiseTypeError("argument 0 is not an array");
        typeError = true;
        goto exit;
    }
    length = ToLong(plugin, nplength, ignored);
    buf = new uint8_t[length];

    status = qcc::Recv(socketFd, buf, length, received);
    if (ER_OK != status) {
        goto exit;
    }

    for (i = 0; i < received; ++i) {
        NPVariant npelem = NPVARIANT_VOID;
        ToOctet(plugin, buf[i], npelem);
        bool set = NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetIntIdentifier(i), &npelem);
        NPN_ReleaseVariantValue(&npelem);
        if (!set) {
            plugin->RaiseTypeError("set array element failed");
            typeError = true;
            goto exit;
        }
    }

exit:
    delete[] buf;
    NPN_ReleaseVariantValue(&nplength);
    if ((ER_OK == status) && !typeError) {
        ToUnsignedLong(plugin, received, *result);
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

bool _SocketFdHost::send(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    bool typeError = false;
    qcc::String url;
    NPError ret;
    qcc::SocketFd streamFd = qcc::INVALID_SOCKET_FD;
    NPVariant nplength = NPVARIANT_VOID;
    bool ignored;
    size_t length;
    uint8_t* buf = 0;
    size_t i;
    size_t sent = 0;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    /*
     * TODO Send URL is disabled due to browser deficiencies.
     */
    if (false) { // NPVARIANT_IS_STRING(args[0])) {
        url = ToDOMString(plugin, args[0], typeError);
        if (typeError) {
            plugin->RaiseTypeError("argument 0 is not a string");
            goto exit;
        }
        QCC_DbgTrace(("url=%s", url.c_str()));

        status = qcc::SocketDup(socketFd, streamFd);
        if (ER_OK != status) {
            QCC_LogError(status, ("SocketDup failed"));
            goto exit;
        }
        ret = NPN_GetURLNotify(plugin->npp, url.c_str(), NULL, reinterpret_cast<void*>(streamFd));
        if (NPERR_NO_ERROR == ret) {
            streamFd = qcc::INVALID_SOCKET_FD; /* NPN stream now owns the FD. */
        } else {
            status = ER_FAIL;
            QCC_LogError(status, ("NPN_GetURLNotify failed - %d", ret));
            goto exit;
        }
        VOID_TO_NPVARIANT(*result);
    } else {
        if (!NPVARIANT_IS_OBJECT(args[0]) ||
            !NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("length"), &nplength) ||
            !(NPVARIANT_IS_INT32(nplength) || NPVARIANT_IS_DOUBLE(nplength))) {
            plugin->RaiseTypeError("argument 0 is not an array");
            typeError = true;
            goto exit;
        }
        length = ToLong(plugin, nplength, ignored);
        buf = new uint8_t[length];

        for (i = 0; i < length; ++i) {
            NPVariant npelem = NPVARIANT_VOID;
            if (!NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetIntIdentifier(i), &npelem)) {
                plugin->RaiseTypeError("get array element failed");
                typeError = true;
                goto exit;
            }
            buf[i] = ToOctet(plugin, npelem, typeError);
            NPN_ReleaseVariantValue(&npelem);
            if (typeError) {
                plugin->RaiseTypeError("array element is not a number");
                goto exit;
            }
        }

        status = qcc::Send(socketFd, buf, length, sent);
        if (ER_OK != status) {
            goto exit;
        }
        ToUnsignedLong(plugin, sent, *result);
    }

exit:
    delete[] buf;
    NPN_ReleaseVariantValue(&nplength);
    if (qcc::INVALID_SOCKET_FD != streamFd) {
        qcc::Close(streamFd);
    }
    if ((ER_OK == status) && !typeError) {
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}
