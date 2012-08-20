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
#include "HttpServer.h"

#include <qcc/Debug.h>
#include <qcc/SocketStream.h>
#include <qcc/StringUtil.h>
#include <qcc/time.h>
#include <algorithm>

#define QCC_MODULE "ALLJOYN_JS"

static void ParseRequest(const qcc::String& line, qcc::String& method, qcc::String& requestUri, qcc::String& httpVersion)
{
    size_t pos = 0;
    size_t begin = 0;
    do {
        size_t sp = line.find_first_of(' ', begin);
        if (qcc::String::npos == sp) {
            sp = line.size();
        }
        qcc::String token = line.substr(begin, sp - begin);
        switch (pos++) {
        case 0:
            method = token;
            break;

        case 1:
            requestUri = token;
            break;

        case 2:
            httpVersion = token;
            break;

        default:
            break;
        }
        begin = sp + 1;
    } while (begin < line.size());
}

static QStatus PushBytes(qcc::SocketStream& stream, const char* buf, size_t numBytes)
{
    /*
     * TODO It looks like PushBytes on SocketStream is not guaranteed to send all the bytes,
     * but it also looks like our existing code relies on that.  What am I missing?
     */
    QStatus status = ER_OK;
    size_t numSent = 0;
    for (size_t pos = 0; pos < numBytes; pos += numSent) {
        status = stream.PushBytes(&buf[pos], numBytes - pos, numSent);
        if (ER_OK != status) {
            QCC_LogError(status, ("PushBytes failed"));
            break;
        }
    }
    return status;
}

static QStatus SendBadRequestResponse(qcc::SocketStream& stream)
{
    qcc::String response = "HTTP/1.1 400 Bad Request\r\n";
    QStatus status = PushBytes(stream, response.data(), response.size());
    if (ER_OK == status) {
        QCC_DbgTrace(("[%d] %s", stream.GetSocketFd(), response.c_str()));
    }
    return status;
}

static QStatus SendNotFoundResponse(qcc::SocketStream& stream)
{
    qcc::String response = "HTTP/1.1 404 Not Found\r\n";
    QStatus status = PushBytes(stream, response.data(), response.size());
    if (ER_OK == status) {
        QCC_DbgTrace(("[%d] %s", stream.GetSocketFd(), response.c_str()));
    }
    return status;
}

HttpServer::RequestThread::RequestThread(HttpServer* httpServer, qcc::SocketFd requestFd)
    : httpServer(httpServer)
    , stream(requestFd)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    stream.SetSendTimeout(qcc::Event::WAIT_FOREVER);
}

qcc::ThreadReturn STDCALL HttpServer::RequestThread::Run(void* arg)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    qcc::String line;
    QStatus status = stream.GetLine(line);
    if (ER_OK != status) {
        SendBadRequestResponse(stream);
        return 0;
    }

    QCC_DbgTrace(("[%d] %s", stream.GetSocketFd(), line.c_str()));
    qcc::String method, requestUri, httpVersion;
    ParseRequest(line, method, requestUri, httpVersion);
    if (method != "GET") {
        SendBadRequestResponse(stream);
        return 0;
    }

    qcc::SocketFd sessionFd = httpServer->GetSessionFd(requestUri);
    if (qcc::INVALID_SOCKET_FD == sessionFd) {
        SendNotFoundResponse(stream);
        return 0;
    }

    /*
     * Read (and discard) the rest of the request headers.
     */
    while ((ER_OK == status) && !line.empty()) {
        line.clear();
        status = stream.GetLine(line);
        if (ER_OK == status) {
            QCC_DbgTrace(("[%d] %s", stream.GetSocketFd(), line.c_str()));
        }
    }
    if (ER_OK != status) {
        SendBadRequestResponse(stream);
        return 0;
    }

    /*
     * TODO What other headers to send out?  The internet says
     * - Content-Type - "Content-Type: " + mimeType + "\r\n"
     * - Server - "Server: AllJoyn HTTP Media Streamer 1.0\r\n"
     * - and either Content-Length - "Content-Length: " + U32ToString(length) + "\r\n",
     *              Transfer-Encoding - "Transfer-Encoding: chunked\r\n",
     *              or Connection - "Connection: close\r\n".
     */
    qcc::String response;
    response = "HTTP/1.1 200 OK\r\n";
    response += "Date: " + qcc::UTCTime() + "\r\n";
    response += "Content-type: application/octet-stream\r\n"; // TODO
    response += "Cache-Control: no-cache\r\n";                // TODO
    response += "\r\n";
    status = PushBytes(stream, response.data(), response.size());
    if (ER_OK != status) {
        return 0;
    }
    QCC_DbgTrace(("[%d] %s", stream.GetSocketFd(), response.c_str()));

    /*
     * Now pump out data.
     */
    char* buffer = new char[4096];
    while (ER_OK == status) {
        size_t received = 0;
        status = qcc::Recv(sessionFd, buffer, 4096, received);
        if (ER_OK == status) {
            if (0 == received) {
                status = ER_SOCK_OTHER_END_CLOSED;
                QCC_LogError(status, ("Recv failed"));
            } else {
                status = PushBytes(stream, buffer, received);
                if (ER_OK != status) {
                    QCC_LogError(status, ("PushBytes failed"));
                }
            }
        } else if (ER_WOULDBLOCK == status) {
            qcc::Event recvEvent(sessionFd, qcc::Event::IO_READ, false);
            status = qcc::Event::Wait(recvEvent);
            if (ER_OK != status) {
                QCC_LogError(status, ("Wait failed"));
            }
        } else {
            QCC_LogError(status, ("Recv failed"));
        }
    }
    delete[] buffer;

    if (ER_OK != status) {
        QCC_LogError(status, ("Request thread exiting"));
    }
    return 0;
}

HttpServer::HttpServer()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

HttpServer::~HttpServer()
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    lock.Lock();
    std::vector<RequestThread*>::iterator tit;
    for (tit = requestThreads.begin(); tit != requestThreads.end(); ++tit) {
        (*tit)->Stop();
    }
    lock.Unlock();
    Stop();

    lock.Lock();
    while (requestThreads.size() > 0) {
        lock.Unlock();
        qcc::Sleep(50);
        lock.Lock();
    }
    lock.Unlock();
    Join();

    std::map<qcc::String, qcc::SocketFd>::iterator sit;
    for (sit = sessionFds.begin(); sit != sessionFds.end(); ++sit) {
        QCC_DbgTrace(("Removed %s -> %d", sit->first.c_str(), sit->second));
        qcc::Close(sit->second);
    }

    QCC_DbgTrace(("-%s", __FUNCTION__));
}

void HttpServer::ThreadExit(qcc::Thread* thread)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    RequestThread* requestThread = static_cast<RequestThread*>(thread);
    lock.Lock();
    std::vector<RequestThread*>::iterator it = std::find(requestThreads.begin(), requestThreads.end(), requestThread);
    if (it != requestThreads.end()) {
        requestThreads.erase(it);
    }
    lock.Unlock();
    delete requestThread;
}

QStatus HttpServer::CreateObjectUrl(qcc::SocketFd fd, qcc::String& url)
{
    QCC_DbgTrace(("%s(fd=%d)", __FUNCTION__, fd));

    QStatus status;
    qcc::SocketFd sessionFd = qcc::INVALID_SOCKET_FD;
    qcc::String requestUri;

    status = Start();
    if (ER_OK != status) {
        goto exit;
    }
    status = qcc::SocketDup(fd, sessionFd);
    if (ER_OK != status) {
        QCC_LogError(status, ("SocketDup failed"));
        goto exit;
    }

    requestUri = "/" + qcc::RandHexString(256);

    lock.Lock();
    sessionFds[requestUri] = sessionFd;
    lock.Unlock();
    QCC_DbgTrace(("Added %s -> %d", requestUri.c_str(), sessionFd));

    url = origin + requestUri;

exit:
    if (ER_OK != status) {
        if (qcc::INVALID_SOCKET_FD != sessionFd) {
            qcc::Close(sessionFd);
        }
    }
    return status;
}

void HttpServer::RevokeObjectUrl(const qcc::String& url)
{
    QCC_DbgTrace(("%s(url=%s)", __FUNCTION__, url.c_str()));

    qcc::SocketFd sessionFd = qcc::INVALID_SOCKET_FD;
    qcc::String requestUri = url.substr(url.find_last_of('/'));

    lock.Lock();
    std::map<qcc::String, qcc::SocketFd>::iterator it = sessionFds.find(requestUri);
    if (it != sessionFds.end()) {
        sessionFd = it->second;
        sessionFds.erase(it);
    }
    lock.Unlock();
    QCC_DbgTrace(("Removed %s -> %d", requestUri.c_str(), sessionFd));

    if (qcc::INVALID_SOCKET_FD != sessionFd) {
        qcc::Close(sessionFd);
    }
}

qcc::SocketFd HttpServer::GetSessionFd(const qcc::String& requestUri)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    lock.Lock();
    qcc::SocketFd sessionFd = qcc::INVALID_SOCKET_FD;
    std::map<qcc::String, qcc::SocketFd>::iterator it = sessionFds.find(requestUri);
    if (it != sessionFds.end()) {
        sessionFd = it->second;
    }
    lock.Unlock();
    return sessionFd;
}

QStatus HttpServer::Start()
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    if (IsStopping()) {
        return ER_THREAD_STOPPING;
    } else if (IsRunning()) {
        return ER_OK;
    }

    QStatus status;
    qcc::SocketFd listenFd = qcc::INVALID_SOCKET_FD;
    qcc::IPAddress localhost("127.0.0.1");
    uint16_t listenPort = 0;

    status = qcc::Socket(qcc::QCC_AF_INET, qcc::QCC_SOCK_STREAM, listenFd);
    if (ER_OK != status) {
        QCC_LogError(status, ("Socket failed"));
        goto exit;
    }
    status = qcc::Bind(listenFd, localhost, listenPort);
    if (ER_OK != status) {
        QCC_LogError(status, ("Find failed"));
        goto exit;
    }
    status = qcc::GetLocalAddress(listenFd, localhost, listenPort);
    if (ER_OK != status) {
        QCC_LogError(status, ("GetLocalAddress failed"));
        goto exit;
    }
    status = qcc::Listen(listenFd, SOMAXCONN);
    if (ER_OK != status) {
        QCC_LogError(status, ("Listen failed"));
        goto exit;
    }
    status = qcc::SetBlocking(listenFd, false);
    if (ER_OK != status) {
        QCC_LogError(status, ("SetBlocking(false) failed"));
        goto exit;
    }
    status = qcc::Thread::Start(reinterpret_cast<void*>(listenFd));
    if (ER_OK != status) {
        QCC_LogError(status, ("Start failed"));
        goto exit;
    }

    origin = "http://" + localhost.ToString() + ":" + qcc::U32ToString(listenPort);
    QCC_DbgTrace(("%s", origin.c_str()));

exit:
    if (ER_OK != status) {
        if (qcc::INVALID_SOCKET_FD != listenFd) {
            qcc::Close(listenFd);
        }
    }
    return status;
}

qcc::ThreadReturn STDCALL HttpServer::Run(void* arg)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    qcc::SocketFd listenFd = reinterpret_cast<intptr_t>(arg);
    QStatus status = ER_OK;

    while (!IsStopping()) {
        qcc::SocketFd requestFd;
        do {
            qcc::IPAddress addr;
            uint16_t remotePort;
            status = qcc::Accept(listenFd, addr, remotePort, requestFd);
            if (ER_OK == status) {
                break;
            } else if (ER_WOULDBLOCK == status) {
                qcc::Event listenEvent(listenFd, qcc::Event::IO_READ, false);
                status = qcc::Event::Wait(listenEvent);
            } else {
                QCC_LogError(status, ("Accept failed"));
                status = ER_OK;
            }
        } while (ER_OK == status);
        if (ER_OK != status) {
            /*
             * qcc:Event::Wait returned an error.  This means the thread is stopping or was alerted
             * or the underlying platform-specific wait failed.  In any case we'll just try again.
             */
            QCC_LogError(status, ("Wait failed"));
            continue;
        }

        RequestThread* requestThread = new RequestThread(this, requestFd);
        status = requestThread->Start(NULL, this);
        if (ER_OK == status) {
            lock.Lock();
            requestThreads.push_back(requestThread);
            lock.Unlock();
        } else {
            QCC_LogError(status, ("Start request thread failed"));
            delete requestThread;
            continue;
        }
    }

    QCC_DbgTrace(("%s exiting", __FUNCTION__));
    qcc::Close(listenFd);
    return 0;
}
