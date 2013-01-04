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
#ifndef _HTTPSERVER_H
#define _HTTPSERVER_H

#include "Plugin.h"
#include <qcc/Socket.h>
#include <qcc/SocketStream.h>
#include <qcc/String.h>
#include <qcc/Thread.h>
#include <map>
#include <vector>
class HttpListenerNative;

namespace Http {
struct less {
    bool operator()(const qcc::String& a, const qcc::String& b) const {
        return strcasecmp(a.c_str(), b.c_str()) < 0;
    }
};
typedef std::map<qcc::String, qcc::String, less> Headers;
};

/*
 * Some care needs to be taken to ensure that a rogue entity cannot intercept the raw session data.
 * This consists of two parts: a shared secret (the request URI) that is transmitted over a secure
 * channel (the NPAPI interface), and an encrypted connection between the HTTP server and the
 * requestor.
 *
 * This means the rogue entity cannot sniff the generated URI, so the chance of them circumventing
 * the security is limited to brute-forcing a 256 bit key.
 *
 * TODO This second part is not yet implemented.
 */
class _HttpServer : public qcc::Thread, public qcc::ThreadListener {
  public:
    _HttpServer(Plugin& plugin);
    virtual ~_HttpServer();
    virtual void ThreadExit(qcc::Thread* thread);

    QStatus CreateObjectUrl(qcc::SocketFd fd, HttpListenerNative* httpListener, qcc::String& url);
    void RevokeObjectUrl(const qcc::String& url);

    class ObjectUrl {
      public:
        qcc::SocketFd fd;
        HttpListenerNative* httpListener;
        ObjectUrl() : fd(qcc::INVALID_SOCKET_FD), httpListener(0) { }
        ObjectUrl(qcc::SocketFd fd, HttpListenerNative* httpListener) : fd(fd), httpListener(httpListener) { }
    };
    ObjectUrl GetObjectUrl(const qcc::String& requestUri);
    void SendResponse(qcc::SocketStream& stream, uint16_t status, qcc::String& statusText, Http::Headers& responseHeaders, qcc::SocketFd fd);

  protected:
    virtual qcc::ThreadReturn STDCALL Run(void* arg);

  private:
    class RequestThread : public qcc::Thread {
      public:
        RequestThread(_HttpServer* httpServer, qcc::SocketFd fd);
        virtual ~RequestThread() { }
      protected:
        virtual qcc::ThreadReturn STDCALL Run(void* arg);
      private:
        _HttpServer* httpServer;
        qcc::SocketStream stream;
    };
    class ResponseThread : public qcc::Thread {
      public:
        ResponseThread(_HttpServer* httpServer, qcc::SocketStream& stream, uint16_t status, qcc::String& statusText, Http::Headers& responseHeaders, qcc::SocketFd sessionFd);
        virtual ~ResponseThread() { }
      protected:
        virtual qcc::ThreadReturn STDCALL Run(void* arg);
      private:
        _HttpServer* httpServer;
        qcc::SocketStream stream;
        uint16_t status;
        qcc::String statusText;
        Http::Headers responseHeaders;
        qcc::SocketFd sessionFd;
    };

    Plugin plugin;
    qcc::String origin;
    std::map<qcc::String, ObjectUrl> objectUrls;
    qcc::Mutex lock;
    std::vector<qcc::Thread*> threads;

    QStatus Start();
};

typedef qcc::ManagedObj<_HttpServer> HttpServer;

#endif
