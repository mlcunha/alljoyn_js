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
#ifndef _SCRIPTABLEOBJECT_H
#define _SCRIPTABLEOBJECT_H

#include "Plugin.h"
#include <map>

class ScriptableObject {
  public:
    ScriptableObject(Plugin& plugin);
    ScriptableObject(Plugin& plugin, std::map<qcc::String, int32_t>& constants);
    virtual ~ScriptableObject();
    virtual void Invalidate();
    virtual bool HasMethod(const qcc::String& name);
    virtual bool Invoke(const qcc::String& name, const NPVariant* args, uint32_t argCount, NPVariant* result);
    virtual bool InvokeDefault(const NPVariant* args, uint32_t argCount, NPVariant* result);
    virtual bool HasProperty(const qcc::String& name);
    virtual bool GetProperty(const qcc::String& name, NPVariant* result);
    virtual bool SetProperty(const qcc::String& name, const NPVariant* value);
    virtual bool RemoveProperty(const qcc::String& name);
    virtual bool Enumerate(NPIdentifier** value, uint32_t* count);
    virtual bool Construct(const NPVariant* args, uint32_t argCount, NPVariant* result);

  protected:
    typedef bool (ScriptableObject::*Get)(NPVariant* result);
    typedef bool (ScriptableObject::*Set)(const NPVariant* value);
    class Attribute {
      public:
        Get get;
        Set set;
        Attribute(Get get, Set set = 0) : get(get), set(set) { }
        Attribute() : get(0), set(0) { }
    };
    typedef bool (ScriptableObject::*Call)(const NPVariant* args, uint32_t argCount, NPVariant* result);
    class Operation {
      public:
        Call call;
        Operation(Call call) : call(call) { }
        Operation() : call(0) { }
    };
    typedef bool (ScriptableObject::*Getter)(const qcc::String& name, NPVariant* result);
    typedef bool (ScriptableObject::*Setter)(const qcc::String& name, const NPVariant* value);
    typedef bool (ScriptableObject::*Deleter)(const qcc::String& name);
    typedef bool (ScriptableObject::*Enumerator)(NPIdentifier** value, uint32_t* count);
    typedef bool (ScriptableObject::*Caller)(const NPVariant* args, uint32_t argCount, NPVariant* result);
    Plugin plugin;
    std::map<qcc::String, Attribute> attributes;
    std::map<qcc::String, Operation> operations;
    Getter getter;
    Setter setter;
    Deleter deleter;
    Enumerator enumerator;
    Caller caller;

  private:
    static std::map<qcc::String, int32_t> noConstants;
    std::map<qcc::String, int32_t>& constants; /* Constants are shared between interface and host objects */
};

#define CONSTANT(name, value) constants[name] = (value)
#define ATTRIBUTE(name, get, set) attributes[name] = Attribute(static_cast<Get>(get), static_cast<Set>(set))
#define OPERATION(name, call) operations[name] = Operation(static_cast<Call>(call))
#define GETTER(customGetter) getter = static_cast<Getter>(customGetter)
#define SETTER(customSetter) setter = static_cast<Setter>(customSetter)
#define DELETER(customDeleter) deleter = static_cast<Deleter>(customDeleter)
#define ENUMERATOR(customEnumerator) enumerator = static_cast<Enumerator>(customEnumerator)
#define CALLER(customCaller) caller = static_cast<Caller>(customCaller)

#endif // _SCRIPTABLEOBJECT_H
