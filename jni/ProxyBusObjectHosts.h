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
#ifndef _PROXYBUSOBJECTHOSTS_H
#define _PROXYBUSOBJECTHOSTS_H

#include "npn.h"
#include <map>
class _ProxyBusObjectHost;
typedef qcc::ManagedObj<_ProxyBusObjectHost> ProxyBusObjectHost;

class _ProxyBusObjectHosts {
  public:
    bool exists(NPIdentifier name);
    ProxyBusObjectHost& find(NPIdentifier name);
    void insert(NPIdentifier name, ProxyBusObjectHost& proxyBusObjectHost);

  private:
    std::map<NPIdentifier, ProxyBusObjectHost> hosts;
};

typedef qcc::ManagedObj<_ProxyBusObjectHosts> ProxyBusObjectHosts;

#endif // _PROXYBUSOBJECTHOSTS_H
