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
#ifndef _HTTPSERVER_H
#define _HTTPSERVER_H

#include <qcc/Socket.h>
#include <qcc/SocketStream.h>
#include <qcc/String.h>
#include <qcc/Thread.h>
#include <map>
#include <vector>

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
class HttpServer : public qcc::Thread, public qcc::ThreadListener {
  public:
    HttpServer();
    virtual ~HttpServer();
    virtual void ThreadExit(qcc::Thread* thread);

    QStatus CreateObjectUrl(qcc::SocketFd fd, qcc::String& url);
    void RevokeObjectUrl(const qcc::String& url);
    qcc::SocketFd GetSessionFd(const qcc::String& requestUri);

  protected:
    virtual qcc::ThreadReturn STDCALL Run(void* arg);

  private:
    class RequestThread : public qcc::Thread {
      public:
        RequestThread(HttpServer* httpServer, qcc::SocketFd fd);
        virtual ~RequestThread() { }
      protected:
        virtual qcc::ThreadReturn STDCALL Run(void* arg);
      private:
        HttpServer* httpServer;
        qcc::SocketStream stream;
    };

    qcc::String origin;
    std::map<qcc::String, qcc::SocketFd> sessionFds;
    qcc::Mutex lock;
    std::vector<RequestThread*> requestThreads;

    QStatus Start();
};

#endif
