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
#ifndef _HTTPREQUESTHOST_H
#define _HTTPREQUESTHOST_H

#include "HttpServer.h"
#include "ScriptableObject.h"
#include <qcc/String.h>
#include <map>

class _HttpRequestHost : public ScriptableObject {
  public:
    _HttpRequestHost(Plugin& plugin, HttpServer& httpServer, Http::Headers& requestHeaders, qcc::SocketStream& stream, qcc::SocketFd sessionFd);
    virtual ~_HttpRequestHost();

  private:
    HttpServer httpServer;
    Http::Headers requestHeaders;
    qcc::SocketStream stream;
    qcc::SocketFd sessionFd;
    uint16_t status;
    qcc::String statusText;
    Http::Headers responseHeaders;

    bool getStatus(NPVariant* result);
    bool setStatus(const NPVariant* value);
    bool getStatusText(NPVariant* result);
    bool setStatusText(const NPVariant* value);

    bool getAllRequestHeaders(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool getRequestHeader(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool setResponseHeader(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool send(const NPVariant* args, uint32_t argCount, NPVariant* result);
};

typedef qcc::ManagedObj<_HttpRequestHost> HttpRequestHost;

#endif // _HTTPREQUESTHOST_H
