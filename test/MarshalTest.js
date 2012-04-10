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
AsyncTestCase("MarshalTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
            otherBus = undefined;
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            if (otherBus) {
                assertEquals(0, otherBus.disconnect());
                otherBus = undefined;
            }
            assertEquals(0, bus.disconnect());
        },

        testBasic: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());

                    bus.interfaces['interface.b'] = { method: [ { name: 'Methodb', signature: 'b', returnSignature: 'b' } ] };
                    bus.interfaces['interface.d'] = { method: [ { name: 'Methodd', signature: 'd', returnSignature: 'd' } ] };
                    bus.interfaces['interface.g'] = { method: [ { name: 'Methodg', signature: 'g', returnSignature: 'g' } ] };
                    bus.interfaces['interface.i'] = { method: [ { name: 'Methodi', signature: 'i', returnSignature: 'i' } ] };
                    bus.interfaces['interface.n'] = { method: [ { name: 'Methodn', signature: 'n', returnSignature: 'n' } ] };
                    bus.interfaces['interface.o'] = { method: [ { name: 'Methodo', signature: 'o', returnSignature: 'o' } ] };
                    bus.interfaces['interface.q'] = { method: [ { name: 'Methodq', signature: 'q', returnSignature: 'q' } ] };
                    bus.interfaces['interface.s'] = { method: [ { name: 'Methods', signature: 's', returnSignature: 's' } ] };
                    bus.interfaces['interface.t'] = { method: [ { name: 'Methodt', signature: 't', returnSignature: 't' } ] };
                    bus.interfaces['interface.u'] = { method: [ { name: 'Methodu', signature: 'u', returnSignature: 'u' } ] };
                    bus.interfaces['interface.x'] = { method: [ { name: 'Methodx', signature: 'x', returnSignature: 'x' } ] };
                    bus.interfaces['interface.y'] = { method: [ { name: 'Methody', signature: 'y', returnSignature: 'y' } ] };

                    bus['/testObject'] = {
                        'interface.b': { Methodb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.d': { Methodd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.g': { Methodg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.i': { Methodi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.n': { Methodn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.o': { Methodo: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.q': { Methodq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.s': { Methods: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.t': { Methodt: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.u': { Methodu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.x': { Methodx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.y': { Methody: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                    };

                    var onErr = callbacks.addErrback(onError);
                    var proxy = bus.proxy[bus.uniqueName + '/testObject'];
                    var onReplyb = callbacks.add(function(context, argb) {
                            assertEquals(true, argb);
                            proxy['interface.d'].Methodd(onReplyd, onErr, 1.234)
                        });
                    var onReplyd = callbacks.add(function(context, argd) {
                            assertEquals(1.234, argd);
                            proxy['interface.g'].Methodg(onReplyg, onErr, "sig")
                        });
                    var onReplyg = callbacks.add(function(context, argg) {
                            assertEquals("sig", argg);
                            proxy['interface.i'].Methodi(onReplyi, onErr, -1)
                        });
                    var onReplyi = callbacks.add(function(context, argi) {
                            assertEquals(-1, argi);
                            proxy['interface.n'].Methodn(onReplyn, onErr, -2)
                        });
                    var onReplyn = callbacks.add(function(context, argn) {
                            assertEquals(-2, argn);
                            proxy['interface.o'].Methodo(onReplyo, onErr, "/path")
                        });
                    var onReplyo = callbacks.add(function(context, argo) {
                            assertEquals("/path", argo);
                            proxy['interface.q'].Methodq(onReplyq, onErr, 3)
                        });
                    var onReplyq = callbacks.add(function(context, argq) {
                            assertEquals(3, argq);
                            proxy['interface.s'].Methods(onReplys, onErr, "string")
                        });
                    var onReplys = callbacks.add(function(context, args) {
                            assertEquals("string", args);
                            proxy['interface.t'].Methodt(onReplyt, onErr, 4)
                        });
                    var onReplyt = callbacks.add(function(context, argt) {
                            assertEquals(4, argt);
                            proxy['interface.u'].Methodu(onReplyu, onErr, 5)
                        });
                    var onReplyu = callbacks.add(function(context, argu) {
                            assertEquals(5, argu);
                            proxy['interface.x'].Methodx(onReplyx, onErr, -6)
                        });
                    var onReplyx = callbacks.add(function(context, argx) {
                            assertEquals(-6, argx);
                            proxy['interface.y'].Methody(onReplyy, onErr, 7)
                        });
                    var onReplyy = callbacks.add(function(context, argy) {
                            assertEquals(7, argy);
                        });
                    proxy['interface.b'].Methodb(onReplyb, onErr, true);
                });
        },

        testArray: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());

                    bus.interfaces['interface.ab'] = { method: [ { name: 'Methodab', signature: 'ab', returnSignature: 'ab' } ] };
                    bus.interfaces['interface.ad'] = { method: [ { name: 'Methodad', signature: 'ad', returnSignature: 'ad' } ] };
                    bus.interfaces['interface.ag'] = { method: [ { name: 'Methodag', signature: 'ag', returnSignature: 'ag' } ] };
                    bus.interfaces['interface.ai'] = { method: [ { name: 'Methodai', signature: 'ai', returnSignature: 'ai' } ] };
                    bus.interfaces['interface.an'] = { method: [ { name: 'Methodan', signature: 'an', returnSignature: 'an' } ] };
                    bus.interfaces['interface.ao'] = { method: [ { name: 'Methodao', signature: 'ao', returnSignature: 'ao' } ] };
                    bus.interfaces['interface.aq'] = { method: [ { name: 'Methodaq', signature: 'aq', returnSignature: 'aq' } ] };
                    bus.interfaces['interface.as'] = { method: [ { name: 'Methodas', signature: 'as', returnSignature: 'as' } ] };
                    bus.interfaces['interface.at'] = { method: [ { name: 'Methodat', signature: 'at', returnSignature: 'at' } ] };
                    bus.interfaces['interface.au'] = { method: [ { name: 'Methodau', signature: 'au', returnSignature: 'au' } ] };
                    bus.interfaces['interface.ax'] = { method: [ { name: 'Methodax', signature: 'ax', returnSignature: 'ax' } ] };
                    bus.interfaces['interface.ay'] = { method: [ { name: 'Methoday', signature: 'ay', returnSignature: 'ay' } ] };
                    bus.interfaces['interface.aas'] = { method: [ { name: 'Methodaas', signature: 'aas', returnSignature: 'aas' } ] };
                    bus.interfaces['interface.ae'] = { method: [ { name: 'Methodae', signature: 'aa{ss}', returnSignature: 'aa{ss}' } ] };
                    bus.interfaces['interface.ar'] = { method: [ { name: 'Methodar', signature: 'a(s)', returnSignature: 'a(s)' } ] };
                    bus.interfaces['interface.av'] = { method: [ { name: 'Methodav', signature: 'av', returnSignature: 'av' } ] };

                    bus['/testObject'] = {
                        'interface.ab': { Methodab: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ad': { Methodad: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ag': { Methodag: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ai': { Methodai: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.an': { Methodan: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ao': { Methodao: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.aq': { Methodaq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.as': { Methodas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.at': { Methodat: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.au': { Methodau: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ax': { Methodax: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ay': { Methoday: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.aas': { Methodaas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ae': { Methodae: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ar': { Methodar: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.av': { 
                            Methodav: function(context, arg) { 
                                var args = [];
                                for (var i = 0; i < arg.length; ++i) {
                                    args[i] = { 's': arg[i] };
                                }
                                assertEquals(0, context.reply(args)); 
                            }
                        },
                    };

                    var onErr = callbacks.addErrback(onError);
                    var proxy = bus.proxy[bus.uniqueName + '/testObject'];
                    var onReplyab = callbacks.add(function(context, argab) {
                            assertEquals([ true, true ], argab);
                            proxy['interface.ad'].Methodad(onReplyad, onErr, [ 1.234, 1.234 ])
                        });
                    var onReplyad = callbacks.add(function(context, argad) {
                            assertEquals([ 1.234, 1.234 ], argad);
                            proxy['interface.ag'].Methodag(onReplyag, onErr, [ "sig", "sig" ])
                        });
                    var onReplyag = callbacks.add(function(context, argag) {
                            assertEquals([ "sig", "sig" ], argag);
                            proxy['interface.ai'].Methodai(onReplyai, onErr, [ -1, -1 ])
                        });
                    var onReplyai = callbacks.add(function(context, argai) {
                            assertEquals([ -1, -1 ], argai);
                            proxy['interface.an'].Methodan(onReplyan, onErr, [ -2, -2 ])
                        });
                    var onReplyan = callbacks.add(function(context, argan) {
                            assertEquals([ -2, -2 ], argan);
                            proxy['interface.ao'].Methodao(onReplyao, onErr, [ "/path", "/path" ])
                        });
                    var onReplyao = callbacks.add(function(context, argao) {
                            assertEquals([ "/path", "/path" ], argao);
                            proxy['interface.aq'].Methodaq(onReplyaq, onErr, [ 3, 3 ])
                        });
                    var onReplyaq = callbacks.add(function(context, argaq) {
                            assertEquals([ 3, 3 ], argaq);
                            proxy['interface.as'].Methodas(onReplyas, onErr, [ "string", "string" ])
                        });
                    var onReplyas = callbacks.add(function(context, argas) {
                            assertEquals([ "string", "string" ], argas);
                            proxy['interface.at'].Methodat(onReplyat, onErr, [ 4, 4 ])
                        });
                    var onReplyat = callbacks.add(function(context, argat) {
                            argat[0] = parseInt(argat[0]);
                            argat[1] = parseInt(argat[1]);
                            assertEquals([ 4, 4 ], argat);
                            proxy['interface.au'].Methodau(onReplyau, onErr, [ 5, 5 ])
                        });
                    var onReplyau = callbacks.add(function(context, argau) {
                            assertEquals([ 5, 5 ], argau);
                            proxy['interface.ax'].Methodax(onReplyax, onErr, [ -6, -6 ])
                        });
                    var onReplyax = callbacks.add(function(context, argax) {
                            argax[0] = parseInt(argax[0]);
                            argax[1] = parseInt(argax[1]);
                            assertEquals([ -6, -6 ], argax);
                            proxy['interface.ay'].Methoday(onReplyay, onErr, [ 7, 7 ])
                        });
                    var onReplyay = callbacks.add(function(context, argay) {
                            assertEquals([ 7, 7 ], argay);
                            proxy['interface.aas'].Methodaas(onReplyaas, onErr, [ ["s0", "s1"], ["s0", "s1"] ])
                        });
                    var onReplyaas = callbacks.add(function(context, argaas) {
                            assertEquals([ ["s0", "s1"], ["s0", "s1"] ], argaas);
                            proxy['interface.ae'].Methodae(onReplyae, onErr, [ { key0: "value0", key1: "value1" }, { key0: "value0", key1: "value1" } ])
                        });
                    var onReplyae = callbacks.add(function(context, argae) {
                            assertEquals([ { key0: "value0", key1: "value1" }, { key0: "value0", key1: "value1" } ], argae);
                            proxy['interface.ar'].Methodar(onReplyar, onErr, [ ["string"], ["string"] ])
                        });
                    var onReplyar = callbacks.add(function(context, argar) {
                            assertEquals([ ["string"], ["string"] ], argar);
                            proxy['interface.av'].Methodav(onReplyav, onErr, [ { s: "string" }, { s: "string" } ])
                        });
                    var onReplyav = callbacks.add(function(context, argav) {
                            assertEquals([ "string", "string" ], argav);
                        });
                    proxy['interface.ab'].Methodab(onReplyab, onErr, [ true, true ]);
                });
        },

        testDictionary: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());

                    bus.interfaces['interface.ebb'] = { method: [ { name: 'Methodebb', signature: 'a{bb}', returnSignature: 'a{bb}' } ] };
                    bus.interfaces['interface.ebd'] = { method: [ { name: 'Methodebd', signature: 'a{bd}', returnSignature: 'a{bd}' } ] };
                    bus.interfaces['interface.ebg'] = { method: [ { name: 'Methodebg', signature: 'a{bg}', returnSignature: 'a{bg}' } ] };
                    bus.interfaces['interface.ebi'] = { method: [ { name: 'Methodebi', signature: 'a{bi}', returnSignature: 'a{bi}' } ] };
                    bus.interfaces['interface.ebn'] = { method: [ { name: 'Methodebn', signature: 'a{bn}', returnSignature: 'a{bn}' } ] };
                    bus.interfaces['interface.ebo'] = { method: [ { name: 'Methodebo', signature: 'a{bo}', returnSignature: 'a{bo}' } ] };
                    bus.interfaces['interface.ebq'] = { method: [ { name: 'Methodebq', signature: 'a{bq}', returnSignature: 'a{bq}' } ] };
                    bus.interfaces['interface.ebs'] = { method: [ { name: 'Methodebs', signature: 'a{bs}', returnSignature: 'a{bs}' } ] };
                    bus.interfaces['interface.ebt'] = { method: [ { name: 'Methodebt', signature: 'a{bt}', returnSignature: 'a{bt}' } ] };
                    bus.interfaces['interface.ebu'] = { method: [ { name: 'Methodebu', signature: 'a{bu}', returnSignature: 'a{bu}' } ] };
                    bus.interfaces['interface.ebx'] = { method: [ { name: 'Methodebx', signature: 'a{bx}', returnSignature: 'a{bx}' } ] };
                    bus.interfaces['interface.eby'] = { method: [ { name: 'Methodeby', signature: 'a{by}', returnSignature: 'a{by}' } ] };
                    bus.interfaces['interface.ebas'] = { method: [ { name: 'Methodebas', signature: 'a{bas}', returnSignature: 'a{bas}' } ] };
                    bus.interfaces['interface.ebe'] = { method: [ { name: 'Methodebe', signature: 'a{ba{ss}}', returnSignature: 'a{ba{ss}}' } ] };
                    bus.interfaces['interface.ebr'] = { method: [ { name: 'Methodebr', signature: 'a{b(s)}', returnSignature: 'a{b(s)}' } ] };
                    bus.interfaces['interface.ebv'] = { method: [ { name: 'Methodebv', signature: 'a{bv}', returnSignature: 'a{bv}' } ] };
                    bus.interfaces['interface.edb'] = { method: [ { name: 'Methodedb', signature: 'a{db}', returnSignature: 'a{db}' } ] };
                    bus.interfaces['interface.edd'] = { method: [ { name: 'Methodedd', signature: 'a{dd}', returnSignature: 'a{dd}' } ] };
                    bus.interfaces['interface.edg'] = { method: [ { name: 'Methodedg', signature: 'a{dg}', returnSignature: 'a{dg}' } ] };
                    bus.interfaces['interface.edi'] = { method: [ { name: 'Methodedi', signature: 'a{di}', returnSignature: 'a{di}' } ] };
                    bus.interfaces['interface.edn'] = { method: [ { name: 'Methodedn', signature: 'a{dn}', returnSignature: 'a{dn}' } ] };
                    bus.interfaces['interface.edo'] = { method: [ { name: 'Methodedo', signature: 'a{do}', returnSignature: 'a{do}' } ] };
                    bus.interfaces['interface.edq'] = { method: [ { name: 'Methodedq', signature: 'a{dq}', returnSignature: 'a{dq}' } ] };
                    bus.interfaces['interface.eds'] = { method: [ { name: 'Methodeds', signature: 'a{ds}', returnSignature: 'a{ds}' } ] };
                    bus.interfaces['interface.edt'] = { method: [ { name: 'Methodedt', signature: 'a{dt}', returnSignature: 'a{dt}' } ] };
                    bus.interfaces['interface.edu'] = { method: [ { name: 'Methodedu', signature: 'a{du}', returnSignature: 'a{du}' } ] };
                    bus.interfaces['interface.edx'] = { method: [ { name: 'Methodedx', signature: 'a{dx}', returnSignature: 'a{dx}' } ] };
                    bus.interfaces['interface.edy'] = { method: [ { name: 'Methodedy', signature: 'a{dy}', returnSignature: 'a{dy}' } ] };
                    bus.interfaces['interface.edas'] = { method: [ { name: 'Methodedas', signature: 'a{das}', returnSignature: 'a{das}' } ] };
                    bus.interfaces['interface.ede'] = { method: [ { name: 'Methodede', signature: 'a{da{ss}}', returnSignature: 'a{da{ss}}' } ] };
                    bus.interfaces['interface.edr'] = { method: [ { name: 'Methodedr', signature: 'a{d(s)}', returnSignature: 'a{d(s)}' } ] };
                    bus.interfaces['interface.edv'] = { method: [ { name: 'Methodedv', signature: 'a{dv}', returnSignature: 'a{dv}' } ] };
                    bus.interfaces['interface.egb'] = { method: [ { name: 'Methodegb', signature: 'a{gb}', returnSignature: 'a{gb}' } ] };
                    bus.interfaces['interface.egd'] = { method: [ { name: 'Methodegd', signature: 'a{gd}', returnSignature: 'a{gd}' } ] };
                    bus.interfaces['interface.egg'] = { method: [ { name: 'Methodegg', signature: 'a{gg}', returnSignature: 'a{gg}' } ] };
                    bus.interfaces['interface.egi'] = { method: [ { name: 'Methodegi', signature: 'a{gi}', returnSignature: 'a{gi}' } ] };
                    bus.interfaces['interface.egn'] = { method: [ { name: 'Methodegn', signature: 'a{gn}', returnSignature: 'a{gn}' } ] };
                    bus.interfaces['interface.ego'] = { method: [ { name: 'Methodego', signature: 'a{go}', returnSignature: 'a{go}' } ] };
                    bus.interfaces['interface.egq'] = { method: [ { name: 'Methodegq', signature: 'a{gq}', returnSignature: 'a{gq}' } ] };
                    bus.interfaces['interface.egs'] = { method: [ { name: 'Methodegs', signature: 'a{gs}', returnSignature: 'a{gs}' } ] };
                    bus.interfaces['interface.egt'] = { method: [ { name: 'Methodegt', signature: 'a{gt}', returnSignature: 'a{gt}' } ] };
                    bus.interfaces['interface.egu'] = { method: [ { name: 'Methodegu', signature: 'a{gu}', returnSignature: 'a{gu}' } ] };
                    bus.interfaces['interface.egx'] = { method: [ { name: 'Methodegx', signature: 'a{gx}', returnSignature: 'a{gx}' } ] };
                    bus.interfaces['interface.egy'] = { method: [ { name: 'Methodegy', signature: 'a{gy}', returnSignature: 'a{gy}' } ] };
                    bus.interfaces['interface.egas'] = { method: [ { name: 'Methodegas', signature: 'a{gas}', returnSignature: 'a{gas}' } ] };
                    bus.interfaces['interface.ege'] = { method: [ { name: 'Methodege', signature: 'a{ga{ss}}', returnSignature: 'a{ga{ss}}' } ] };
                    bus.interfaces['interface.egr'] = { method: [ { name: 'Methodegr', signature: 'a{g(s)}', returnSignature: 'a{g(s)}' } ] };
                    bus.interfaces['interface.egv'] = { method: [ { name: 'Methodegv', signature: 'a{gv}', returnSignature: 'a{gv}' } ] };
                    bus.interfaces['interface.eib'] = { method: [ { name: 'Methodeib', signature: 'a{ib}', returnSignature: 'a{ib}' } ] };
                    bus.interfaces['interface.eid'] = { method: [ { name: 'Methodeid', signature: 'a{id}', returnSignature: 'a{id}' } ] };
                    bus.interfaces['interface.eig'] = { method: [ { name: 'Methodeig', signature: 'a{ig}', returnSignature: 'a{ig}' } ] };
                    bus.interfaces['interface.eii'] = { method: [ { name: 'Methodeii', signature: 'a{ii}', returnSignature: 'a{ii}' } ] };
                    bus.interfaces['interface.ein'] = { method: [ { name: 'Methodein', signature: 'a{in}', returnSignature: 'a{in}' } ] };
                    bus.interfaces['interface.eio'] = { method: [ { name: 'Methodeio', signature: 'a{io}', returnSignature: 'a{io}' } ] };
                    bus.interfaces['interface.eiq'] = { method: [ { name: 'Methodeiq', signature: 'a{iq}', returnSignature: 'a{iq}' } ] };
                    bus.interfaces['interface.eis'] = { method: [ { name: 'Methodeis', signature: 'a{is}', returnSignature: 'a{is}' } ] };
                    bus.interfaces['interface.eit'] = { method: [ { name: 'Methodeit', signature: 'a{it}', returnSignature: 'a{it}' } ] };
                    bus.interfaces['interface.eiu'] = { method: [ { name: 'Methodeiu', signature: 'a{iu}', returnSignature: 'a{iu}' } ] };
                    bus.interfaces['interface.eix'] = { method: [ { name: 'Methodeix', signature: 'a{ix}', returnSignature: 'a{ix}' } ] };
                    bus.interfaces['interface.eiy'] = { method: [ { name: 'Methodeiy', signature: 'a{iy}', returnSignature: 'a{iy}' } ] };
                    bus.interfaces['interface.eias'] = { method: [ { name: 'Methodeias', signature: 'a{ias}', returnSignature: 'a{ias}' } ] };
                    bus.interfaces['interface.eie'] = { method: [ { name: 'Methodeie', signature: 'a{ia{ss}}', returnSignature: 'a{ia{ss}}' } ] };
                    bus.interfaces['interface.eir'] = { method: [ { name: 'Methodeir', signature: 'a{i(s)}', returnSignature: 'a{i(s)}' } ] };
                    bus.interfaces['interface.eiv'] = { method: [ { name: 'Methodeiv', signature: 'a{iv}', returnSignature: 'a{iv}' } ] };
                    bus.interfaces['interface.enb'] = { method: [ { name: 'Methodenb', signature: 'a{nb}', returnSignature: 'a{nb}' } ] };
                    bus.interfaces['interface.end'] = { method: [ { name: 'Methodend', signature: 'a{nd}', returnSignature: 'a{nd}' } ] };
                    bus.interfaces['interface.eng'] = { method: [ { name: 'Methodeng', signature: 'a{ng}', returnSignature: 'a{ng}' } ] };
                    bus.interfaces['interface.eni'] = { method: [ { name: 'Methodeni', signature: 'a{ni}', returnSignature: 'a{ni}' } ] };
                    bus.interfaces['interface.enn'] = { method: [ { name: 'Methodenn', signature: 'a{nn}', returnSignature: 'a{nn}' } ] };
                    bus.interfaces['interface.eno'] = { method: [ { name: 'Methodeno', signature: 'a{no}', returnSignature: 'a{no}' } ] };
                    bus.interfaces['interface.enq'] = { method: [ { name: 'Methodenq', signature: 'a{nq}', returnSignature: 'a{nq}' } ] };
                    bus.interfaces['interface.ens'] = { method: [ { name: 'Methodens', signature: 'a{ns}', returnSignature: 'a{ns}' } ] };
                    bus.interfaces['interface.ent'] = { method: [ { name: 'Methodent', signature: 'a{nt}', returnSignature: 'a{nt}' } ] };
                    bus.interfaces['interface.enu'] = { method: [ { name: 'Methodenu', signature: 'a{nu}', returnSignature: 'a{nu}' } ] };
                    bus.interfaces['interface.enx'] = { method: [ { name: 'Methodenx', signature: 'a{nx}', returnSignature: 'a{nx}' } ] };
                    bus.interfaces['interface.eny'] = { method: [ { name: 'Methodeny', signature: 'a{ny}', returnSignature: 'a{ny}' } ] };
                    bus.interfaces['interface.enas'] = { method: [ { name: 'Methodenas', signature: 'a{nas}', returnSignature: 'a{nas}' } ] };
                    bus.interfaces['interface.ene'] = { method: [ { name: 'Methodene', signature: 'a{na{ss}}', returnSignature: 'a{na{ss}}' } ] };
                    bus.interfaces['interface.enr'] = { method: [ { name: 'Methodenr', signature: 'a{n(s)}', returnSignature: 'a{n(s)}' } ] };
                    bus.interfaces['interface.env'] = { method: [ { name: 'Methodenv', signature: 'a{nv}', returnSignature: 'a{nv}' } ] };
                    bus.interfaces['interface.eob'] = { method: [ { name: 'Methodeob', signature: 'a{ob}', returnSignature: 'a{ob}' } ] };
                    bus.interfaces['interface.eod'] = { method: [ { name: 'Methodeod', signature: 'a{od}', returnSignature: 'a{od}' } ] };
                    bus.interfaces['interface.eog'] = { method: [ { name: 'Methodeog', signature: 'a{og}', returnSignature: 'a{og}' } ] };
                    bus.interfaces['interface.eoi'] = { method: [ { name: 'Methodeoi', signature: 'a{oi}', returnSignature: 'a{oi}' } ] };
                    bus.interfaces['interface.eon'] = { method: [ { name: 'Methodeon', signature: 'a{on}', returnSignature: 'a{on}' } ] };
                    bus.interfaces['interface.eoo'] = { method: [ { name: 'Methodeoo', signature: 'a{oo}', returnSignature: 'a{oo}' } ] };
                    bus.interfaces['interface.eoq'] = { method: [ { name: 'Methodeoq', signature: 'a{oq}', returnSignature: 'a{oq}' } ] };
                    bus.interfaces['interface.eos'] = { method: [ { name: 'Methodeos', signature: 'a{os}', returnSignature: 'a{os}' } ] };
                    bus.interfaces['interface.eot'] = { method: [ { name: 'Methodeot', signature: 'a{ot}', returnSignature: 'a{ot}' } ] };
                    bus.interfaces['interface.eou'] = { method: [ { name: 'Methodeou', signature: 'a{ou}', returnSignature: 'a{ou}' } ] };
                    bus.interfaces['interface.eox'] = { method: [ { name: 'Methodeox', signature: 'a{ox}', returnSignature: 'a{ox}' } ] };
                    bus.interfaces['interface.eoy'] = { method: [ { name: 'Methodeoy', signature: 'a{oy}', returnSignature: 'a{oy}' } ] };
                    bus.interfaces['interface.eoas'] = { method: [ { name: 'Methodeoas', signature: 'a{oas}', returnSignature: 'a{oas}' } ] };
                    bus.interfaces['interface.eoe'] = { method: [ { name: 'Methodeoe', signature: 'a{oa{ss}}', returnSignature: 'a{oa{ss}}' } ] };
                    bus.interfaces['interface.eor'] = { method: [ { name: 'Methodeor', signature: 'a{o(s)}', returnSignature: 'a{o(s)}' } ] };
                    bus.interfaces['interface.eov'] = { method: [ { name: 'Methodeov', signature: 'a{ov}', returnSignature: 'a{ov}' } ] };
                    bus.interfaces['interface.eqb'] = { method: [ { name: 'Methodeqb', signature: 'a{qb}', returnSignature: 'a{qb}' } ] };
                    bus.interfaces['interface.eqd'] = { method: [ { name: 'Methodeqd', signature: 'a{qd}', returnSignature: 'a{qd}' } ] };
                    bus.interfaces['interface.eqg'] = { method: [ { name: 'Methodeqg', signature: 'a{qg}', returnSignature: 'a{qg}' } ] };
                    bus.interfaces['interface.eqi'] = { method: [ { name: 'Methodeqi', signature: 'a{qi}', returnSignature: 'a{qi}' } ] };
                    bus.interfaces['interface.eqn'] = { method: [ { name: 'Methodeqn', signature: 'a{qn}', returnSignature: 'a{qn}' } ] };
                    bus.interfaces['interface.eqo'] = { method: [ { name: 'Methodeqo', signature: 'a{qo}', returnSignature: 'a{qo}' } ] };
                    bus.interfaces['interface.eqq'] = { method: [ { name: 'Methodeqq', signature: 'a{qq}', returnSignature: 'a{qq}' } ] };
                    bus.interfaces['interface.eqs'] = { method: [ { name: 'Methodeqs', signature: 'a{qs}', returnSignature: 'a{qs}' } ] };
                    bus.interfaces['interface.eqt'] = { method: [ { name: 'Methodeqt', signature: 'a{qt}', returnSignature: 'a{qt}' } ] };
                    bus.interfaces['interface.equ'] = { method: [ { name: 'Methodequ', signature: 'a{qu}', returnSignature: 'a{qu}' } ] };
                    bus.interfaces['interface.eqx'] = { method: [ { name: 'Methodeqx', signature: 'a{qx}', returnSignature: 'a{qx}' } ] };
                    bus.interfaces['interface.eqy'] = { method: [ { name: 'Methodeqy', signature: 'a{qy}', returnSignature: 'a{qy}' } ] };
                    bus.interfaces['interface.eqas'] = { method: [ { name: 'Methodeqas', signature: 'a{qas}', returnSignature: 'a{qas}' } ] };
                    bus.interfaces['interface.eqe'] = { method: [ { name: 'Methodeqe', signature: 'a{qa{ss}}', returnSignature: 'a{qa{ss}}' } ] };
                    bus.interfaces['interface.eqr'] = { method: [ { name: 'Methodeqr', signature: 'a{q(s)}', returnSignature: 'a{q(s)}' } ] };
                    bus.interfaces['interface.eqv'] = { method: [ { name: 'Methodeqv', signature: 'a{qv}', returnSignature: 'a{qv}' } ] };
                    bus.interfaces['interface.esb'] = { method: [ { name: 'Methodesb', signature: 'a{sb}', returnSignature: 'a{sb}' } ] };
                    bus.interfaces['interface.esd'] = { method: [ { name: 'Methodesd', signature: 'a{sd}', returnSignature: 'a{sd}' } ] };
                    bus.interfaces['interface.esg'] = { method: [ { name: 'Methodesg', signature: 'a{sg}', returnSignature: 'a{sg}' } ] };
                    bus.interfaces['interface.esi'] = { method: [ { name: 'Methodesi', signature: 'a{si}', returnSignature: 'a{si}' } ] };
                    bus.interfaces['interface.esn'] = { method: [ { name: 'Methodesn', signature: 'a{sn}', returnSignature: 'a{sn}' } ] };
                    bus.interfaces['interface.eso'] = { method: [ { name: 'Methodeso', signature: 'a{so}', returnSignature: 'a{so}' } ] };
                    bus.interfaces['interface.esq'] = { method: [ { name: 'Methodesq', signature: 'a{sq}', returnSignature: 'a{sq}' } ] };
                    bus.interfaces['interface.ess'] = { method: [ { name: 'Methodess', signature: 'a{ss}', returnSignature: 'a{ss}' } ] };
                    bus.interfaces['interface.est'] = { method: [ { name: 'Methodest', signature: 'a{st}', returnSignature: 'a{st}' } ] };
                    bus.interfaces['interface.esu'] = { method: [ { name: 'Methodesu', signature: 'a{su}', returnSignature: 'a{su}' } ] };
                    bus.interfaces['interface.esx'] = { method: [ { name: 'Methodesx', signature: 'a{sx}', returnSignature: 'a{sx}' } ] };
                    bus.interfaces['interface.esy'] = { method: [ { name: 'Methodesy', signature: 'a{sy}', returnSignature: 'a{sy}' } ] };
                    bus.interfaces['interface.esas'] = { method: [ { name: 'Methodesas', signature: 'a{sas}', returnSignature: 'a{sas}' } ] };
                    bus.interfaces['interface.ese'] = { method: [ { name: 'Methodese', signature: 'a{sa{ss}}', returnSignature: 'a{sa{ss}}' } ] };
                    bus.interfaces['interface.esr'] = { method: [ { name: 'Methodesr', signature: 'a{s(s)}', returnSignature: 'a{s(s)}' } ] };
                    bus.interfaces['interface.esv'] = { method: [ { name: 'Methodesv', signature: 'a{sv}', returnSignature: 'a{sv}' } ] };
                    bus.interfaces['interface.etb'] = { method: [ { name: 'Methodetb', signature: 'a{tb}', returnSignature: 'a{tb}' } ] };
                    bus.interfaces['interface.etd'] = { method: [ { name: 'Methodetd', signature: 'a{td}', returnSignature: 'a{td}' } ] };
                    bus.interfaces['interface.etg'] = { method: [ { name: 'Methodetg', signature: 'a{tg}', returnSignature: 'a{tg}' } ] };
                    bus.interfaces['interface.eti'] = { method: [ { name: 'Methodeti', signature: 'a{ti}', returnSignature: 'a{ti}' } ] };
                    bus.interfaces['interface.etn'] = { method: [ { name: 'Methodetn', signature: 'a{tn}', returnSignature: 'a{tn}' } ] };
                    bus.interfaces['interface.eto'] = { method: [ { name: 'Methodeto', signature: 'a{to}', returnSignature: 'a{to}' } ] };
                    bus.interfaces['interface.etq'] = { method: [ { name: 'Methodetq', signature: 'a{tq}', returnSignature: 'a{tq}' } ] };
                    bus.interfaces['interface.ets'] = { method: [ { name: 'Methodets', signature: 'a{ts}', returnSignature: 'a{ts}' } ] };
                    bus.interfaces['interface.ett'] = { method: [ { name: 'Methodett', signature: 'a{tt}', returnSignature: 'a{tt}' } ] };
                    bus.interfaces['interface.etu'] = { method: [ { name: 'Methodetu', signature: 'a{tu}', returnSignature: 'a{tu}' } ] };
                    bus.interfaces['interface.etx'] = { method: [ { name: 'Methodetx', signature: 'a{tx}', returnSignature: 'a{tx}' } ] };
                    bus.interfaces['interface.ety'] = { method: [ { name: 'Methodety', signature: 'a{ty}', returnSignature: 'a{ty}' } ] };
                    bus.interfaces['interface.etas'] = { method: [ { name: 'Methodetas', signature: 'a{tas}', returnSignature: 'a{tas}' } ] };
                    bus.interfaces['interface.ete'] = { method: [ { name: 'Methodete', signature: 'a{ta{ss}}', returnSignature: 'a{ta{ss}}' } ] };
                    bus.interfaces['interface.etr'] = { method: [ { name: 'Methodetr', signature: 'a{t(s)}', returnSignature: 'a{t(s)}' } ] };
                    bus.interfaces['interface.etv'] = { method: [ { name: 'Methodetv', signature: 'a{tv}', returnSignature: 'a{tv}' } ] };
                    bus.interfaces['interface.eub'] = { method: [ { name: 'Methodeub', signature: 'a{ub}', returnSignature: 'a{ub}' } ] };
                    bus.interfaces['interface.eud'] = { method: [ { name: 'Methodeud', signature: 'a{ud}', returnSignature: 'a{ud}' } ] };
                    bus.interfaces['interface.eug'] = { method: [ { name: 'Methodeug', signature: 'a{ug}', returnSignature: 'a{ug}' } ] };
                    bus.interfaces['interface.eui'] = { method: [ { name: 'Methodeui', signature: 'a{ui}', returnSignature: 'a{ui}' } ] };
                    bus.interfaces['interface.eun'] = { method: [ { name: 'Methodeun', signature: 'a{un}', returnSignature: 'a{un}' } ] };
                    bus.interfaces['interface.euo'] = { method: [ { name: 'Methodeuo', signature: 'a{uo}', returnSignature: 'a{uo}' } ] };
                    bus.interfaces['interface.euq'] = { method: [ { name: 'Methodeuq', signature: 'a{uq}', returnSignature: 'a{uq}' } ] };
                    bus.interfaces['interface.eus'] = { method: [ { name: 'Methodeus', signature: 'a{us}', returnSignature: 'a{us}' } ] };
                    bus.interfaces['interface.eut'] = { method: [ { name: 'Methodeut', signature: 'a{ut}', returnSignature: 'a{ut}' } ] };
                    bus.interfaces['interface.euu'] = { method: [ { name: 'Methodeuu', signature: 'a{uu}', returnSignature: 'a{uu}' } ] };
                    bus.interfaces['interface.eux'] = { method: [ { name: 'Methodeux', signature: 'a{ux}', returnSignature: 'a{ux}' } ] };
                    bus.interfaces['interface.euy'] = { method: [ { name: 'Methodeuy', signature: 'a{uy}', returnSignature: 'a{uy}' } ] };
                    bus.interfaces['interface.euas'] = { method: [ { name: 'Methodeuas', signature: 'a{uas}', returnSignature: 'a{uas}' } ] };
                    bus.interfaces['interface.eue'] = { method: [ { name: 'Methodeue', signature: 'a{ua{ss}}', returnSignature: 'a{ua{ss}}' } ] };
                    bus.interfaces['interface.eur'] = { method: [ { name: 'Methodeur', signature: 'a{u(s)}', returnSignature: 'a{u(s)}' } ] };
                    bus.interfaces['interface.euv'] = { method: [ { name: 'Methodeuv', signature: 'a{uv}', returnSignature: 'a{uv}' } ] };
                    bus.interfaces['interface.exb'] = { method: [ { name: 'Methodexb', signature: 'a{xb}', returnSignature: 'a{xb}' } ] };
                    bus.interfaces['interface.exd'] = { method: [ { name: 'Methodexd', signature: 'a{xd}', returnSignature: 'a{xd}' } ] };
                    bus.interfaces['interface.exg'] = { method: [ { name: 'Methodexg', signature: 'a{xg}', returnSignature: 'a{xg}' } ] };
                    bus.interfaces['interface.exi'] = { method: [ { name: 'Methodexi', signature: 'a{xi}', returnSignature: 'a{xi}' } ] };
                    bus.interfaces['interface.exn'] = { method: [ { name: 'Methodexn', signature: 'a{xn}', returnSignature: 'a{xn}' } ] };
                    bus.interfaces['interface.exo'] = { method: [ { name: 'Methodexo', signature: 'a{xo}', returnSignature: 'a{xo}' } ] };
                    bus.interfaces['interface.exq'] = { method: [ { name: 'Methodexq', signature: 'a{xq}', returnSignature: 'a{xq}' } ] };
                    bus.interfaces['interface.exs'] = { method: [ { name: 'Methodexs', signature: 'a{xs}', returnSignature: 'a{xs}' } ] };
                    bus.interfaces['interface.ext'] = { method: [ { name: 'Methodext', signature: 'a{xt}', returnSignature: 'a{xt}' } ] };
                    bus.interfaces['interface.exu'] = { method: [ { name: 'Methodexu', signature: 'a{xu}', returnSignature: 'a{xu}' } ] };
                    bus.interfaces['interface.exx'] = { method: [ { name: 'Methodexx', signature: 'a{xx}', returnSignature: 'a{xx}' } ] };
                    bus.interfaces['interface.exy'] = { method: [ { name: 'Methodexy', signature: 'a{xy}', returnSignature: 'a{xy}' } ] };
                    bus.interfaces['interface.exas'] = { method: [ { name: 'Methodexas', signature: 'a{xas}', returnSignature: 'a{xas}' } ] };
                    bus.interfaces['interface.exe'] = { method: [ { name: 'Methodexe', signature: 'a{xa{ss}}', returnSignature: 'a{xa{ss}}' } ] };
                    bus.interfaces['interface.exr'] = { method: [ { name: 'Methodexr', signature: 'a{x(s)}', returnSignature: 'a{x(s)}' } ] };
                    bus.interfaces['interface.exv'] = { method: [ { name: 'Methodexv', signature: 'a{xv}', returnSignature: 'a{xv}' } ] };
                    bus.interfaces['interface.eyb'] = { method: [ { name: 'Methodeyb', signature: 'a{yb}', returnSignature: 'a{yb}' } ] };
                    bus.interfaces['interface.eyd'] = { method: [ { name: 'Methodeyd', signature: 'a{yd}', returnSignature: 'a{yd}' } ] };
                    bus.interfaces['interface.eyg'] = { method: [ { name: 'Methodeyg', signature: 'a{yg}', returnSignature: 'a{yg}' } ] };
                    bus.interfaces['interface.eyi'] = { method: [ { name: 'Methodeyi', signature: 'a{yi}', returnSignature: 'a{yi}' } ] };
                    bus.interfaces['interface.eyn'] = { method: [ { name: 'Methodeyn', signature: 'a{yn}', returnSignature: 'a{yn}' } ] };
                    bus.interfaces['interface.eyo'] = { method: [ { name: 'Methodeyo', signature: 'a{yo}', returnSignature: 'a{yo}' } ] };
                    bus.interfaces['interface.eyq'] = { method: [ { name: 'Methodeyq', signature: 'a{yq}', returnSignature: 'a{yq}' } ] };
                    bus.interfaces['interface.eys'] = { method: [ { name: 'Methodeys', signature: 'a{ys}', returnSignature: 'a{ys}' } ] };
                    bus.interfaces['interface.eyt'] = { method: [ { name: 'Methodeyt', signature: 'a{yt}', returnSignature: 'a{yt}' } ] };
                    bus.interfaces['interface.eyu'] = { method: [ { name: 'Methodeyu', signature: 'a{yu}', returnSignature: 'a{yu}' } ] };
                    bus.interfaces['interface.eyx'] = { method: [ { name: 'Methodeyx', signature: 'a{yx}', returnSignature: 'a{yx}' } ] };
                    bus.interfaces['interface.eyy'] = { method: [ { name: 'Methodeyy', signature: 'a{yy}', returnSignature: 'a{yy}' } ] };
                    bus.interfaces['interface.eyas'] = { method: [ { name: 'Methodeyas', signature: 'a{yas}', returnSignature: 'a{yas}' } ] };
                    bus.interfaces['interface.eye'] = { method: [ { name: 'Methodeye', signature: 'a{ya{ss}}', returnSignature: 'a{ya{ss}}' } ] };
                    bus.interfaces['interface.eyr'] = { method: [ { name: 'Methodeyr', signature: 'a{y(s)}', returnSignature: 'a{y(s)}' } ] };
                    bus.interfaces['interface.eyv'] = { method: [ { name: 'Methodeyv', signature: 'a{yv}', returnSignature: 'a{yv}' } ] };

                    bus['/testObject'] = {
                        'interface.ebb': { Methodebb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebd': { Methodebd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebg': { Methodebg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebi': { Methodebi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebn': { Methodebn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebo': { Methodebo: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebq': { Methodebq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebs': { Methodebs: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebt': { Methodebt: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebu': { Methodebu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebx': { Methodebx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eby': { Methodeby: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebas': { Methodebas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebe': { Methodebe: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebr': { Methodebr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ebv': {
                            Methodebv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.edb': { Methodedb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edd': { Methodedd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edg': { Methodedg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edi': { Methodedi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edn': { Methodedn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edo': { Methodedo: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edq': { Methodedq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eds': { Methodeds: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edt': { Methodedt: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edu': { Methodedu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edx': { Methodedx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edy': { Methodedy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edas': { Methodedas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ede': { Methodede: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edr': { Methodedr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.edv': {
                            Methodedv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.egb': { Methodegb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egd': { Methodegd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egg': { Methodegg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egi': { Methodegi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egn': { Methodegn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ego': { Methodego: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egq': { Methodegq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egs': { Methodegs: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egt': { Methodegt: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egu': { Methodegu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egx': { Methodegx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egy': { Methodegy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egas': { Methodegas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ege': { Methodege: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egr': { Methodegr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.egv': {
                            Methodegv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.eib': { Methodeib: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eid': { Methodeid: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eig': { Methodeig: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eii': { Methodeii: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ein': { Methodein: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eio': { Methodeio: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eiq': { Methodeiq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eis': { Methodeis: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eit': { Methodeit: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eiu': { Methodeiu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eix': { Methodeix: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eiy': { Methodeiy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eias': { Methodeias: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eie': { Methodeie: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eir': { Methodeir: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eiv': {
                            Methodeiv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.enb': { Methodenb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.end': { Methodend: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eng': { Methodeng: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eni': { Methodeni: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.enn': { Methodenn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eno': { Methodeno: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.enq': { Methodenq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ens': { Methodens: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ent': { Methodent: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.enu': { Methodenu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.enx': { Methodenx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eny': { Methodeny: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.enas': { Methodenas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ene': { Methodene: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.enr': { Methodenr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.env': {
                            Methodenv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.eob': { Methodeob: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eod': { Methodeod: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eog': { Methodeog: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eoi': { Methodeoi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eon': { Methodeon: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eoo': { Methodeoo: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eoq': { Methodeoq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eos': { Methodeos: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eot': { Methodeot: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eou': { Methodeou: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eox': { Methodeox: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eoy': { Methodeoy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eoas': { Methodeoas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eoe': { Methodeoe: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eor': { Methodeor: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eov': {
                            Methodeov: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.eqb': { Methodeqb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqd': { Methodeqd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqg': { Methodeqg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqi': { Methodeqi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqn': { Methodeqn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqo': { Methodeqo: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqq': { Methodeqq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqs': { Methodeqs: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqt': { Methodeqt: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.equ': { Methodequ: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqx': { Methodeqx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqy': { Methodeqy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqas': { Methodeqas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqe': { Methodeqe: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqr': { Methodeqr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eqv': {
                            Methodeqv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.esb': { Methodesb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esd': { Methodesd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esg': { Methodesg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esi': { Methodesi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esn': { Methodesn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eso': { Methodeso: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esq': { Methodesq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ess': { Methodess: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.est': { Methodest: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esu': { Methodesu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esx': { Methodesx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esy': { Methodesy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esas': { Methodesas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ese': { Methodese: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esr': { Methodesr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.esv': {
                            Methodesv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.etb': { Methodetb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etd': { Methodetd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etg': { Methodetg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eti': { Methodeti: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etn': { Methodetn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eto': { Methodeto: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etq': { Methodetq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ets': { Methodets: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ett': { Methodett: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etu': { Methodetu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etx': { Methodetx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ety': { Methodety: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etas': { Methodetas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ete': { Methodete: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etr': { Methodetr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.etv': {
                            Methodetv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.eub': { Methodeub: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eud': { Methodeud: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eug': { Methodeug: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eui': { Methodeui: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eun': { Methodeun: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.euo': { Methodeuo: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.euq': { Methodeuq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eus': { Methodeus: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eut': { Methodeut: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.euu': { Methodeuu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eux': { Methodeux: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.euy': { Methodeuy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.euas': { Methodeuas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eue': { Methodeue: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eur': { Methodeur: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.euv': {
                            Methodeuv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.exb': { Methodexb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exd': { Methodexd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exg': { Methodexg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exi': { Methodexi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exn': { Methodexn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exo': { Methodexo: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exq': { Methodexq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exs': { Methodexs: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ext': { Methodext: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exu': { Methodexu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exx': { Methodexx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exy': { Methodexy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exas': { Methodexas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exe': { Methodexe: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exr': { Methodexr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.exv': {
                            Methodexv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                        'interface.eyb': { Methodeyb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyd': { Methodeyd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyg': { Methodeyg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyi': { Methodeyi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyn': { Methodeyn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyo': { Methodeyo: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyq': { Methodeyq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eys': { Methodeys: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyt': { Methodeyt: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyu': { Methodeyu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyx': { Methodeyx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyy': { Methodeyy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyas': { Methodeyas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eye': { Methodeye: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyr': { Methodeyr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.eyv': {
                            Methodeyv: function(context, arg) {
                                var args = {};
                                for (var name in arg) {
                                    args[name] = { 's': arg[name] };
                                }
                                assertEquals(0, context.reply(args));
                            }
                        },
                    };

                    var proxy = bus.proxy[bus.uniqueName + '/testObject'];
                    var onReplyebb = callbacks.add(function(context, argebb) {
                            assertEquals({ "true": true }, argebb);
                            proxy['interface.ebd'].Methodebd(onReplyebd, callbacks.addErrback('argebb', onError), { "true": 1.234 });
                        });
                    var onReplyebd = callbacks.add(function(context, argebd) {
                            assertEquals({ "true": 1.234 }, argebd);
                            proxy['interface.ebg'].Methodebg(onReplyebg, callbacks.addErrback('argebd', onError), { "true": "sig" });
                        });
                    var onReplyebg = callbacks.add(function(context, argebg) {
                            assertEquals({ "true": "sig" }, argebg);
                            proxy['interface.ebi'].Methodebi(onReplyebi, callbacks.addErrback('argebg', onError), { "true": -1 });
                        });
                    var onReplyebi = callbacks.add(function(context, argebi) {
                            assertEquals({ "true": -1 }, argebi);
                            proxy['interface.ebn'].Methodebn(onReplyebn, callbacks.addErrback('argebi', onError), { "true": -2 });
                        });
                    var onReplyebn = callbacks.add(function(context, argebn) {
                            assertEquals({ "true": -2 }, argebn);
                            proxy['interface.ebo'].Methodebo(onReplyebo, callbacks.addErrback('argebn', onError), { "true": "/path" });
                        });
                    var onReplyebo = callbacks.add(function(context, argebo) {
                            assertEquals({ "true": "/path" }, argebo);
                            proxy['interface.ebq'].Methodebq(onReplyebq, callbacks.addErrback('argebo', onError), { "true": 3 });
                        });
                    var onReplyebq = callbacks.add(function(context, argebq) {
                            assertEquals({ "true": 3 }, argebq);
                            proxy['interface.ebs'].Methodebs(onReplyebs, callbacks.addErrback('argebq', onError), { "true": "string" });
                        });
                    var onReplyebs = callbacks.add(function(context, argebs) {
                            assertEquals({ "true": "string" }, argebs);
                            proxy['interface.ebt'].Methodebt(onReplyebt, callbacks.addErrback('argebs', onError), { "true": 4 });
                        });
                    var onReplyebt = callbacks.add(function(context, argebt) {
                            argebt["true"] = parseInt(argebt["true"]);
                            assertEquals({ "true": 4 }, argebt);
                            proxy['interface.ebu'].Methodebu(onReplyebu, callbacks.addErrback('argebt', onError), { "true": 5 });
                        });
                    var onReplyebu = callbacks.add(function(context, argebu) {
                            assertEquals({ "true": 5 }, argebu);
                            proxy['interface.ebx'].Methodebx(onReplyebx, callbacks.addErrback('argebu', onError), { "true": -6 });
                        });
                    var onReplyebx = callbacks.add(function(context, argebx) {
                            argebx["true"] = parseInt(argebx["true"]);
                            assertEquals({ "true": -6 }, argebx);
                            proxy['interface.eby'].Methodeby(onReplyeby, callbacks.addErrback('argebx', onError), { "true": 7 });
                        });
                    var onReplyeby = callbacks.add(function(context, argeby) {
                            assertEquals({ "true": 7 }, argeby);
                            proxy['interface.ebas'].Methodebas(onReplyebas, callbacks.addErrback('argeby', onError), { "true": ["s0", "s1"] });
                        });
                    var onReplyebas = callbacks.add(function(context, argebas) {
                            assertEquals({ "true": ["s0", "s1"] }, argebas);
                            proxy['interface.ebe'].Methodebe(onReplyebe, callbacks.addErrback('argebas', onError), { "true": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyebe = callbacks.add(function(context, argebe) {
                            assertEquals({ "true": { key0: "value0", key1: "value1" } }, argebe);
                            proxy['interface.ebr'].Methodebr(onReplyebr, callbacks.addErrback('argebe', onError), { "true": ["string"] });
                        });
                    var onReplyebr = callbacks.add(function(context, argebr) {
                            assertEquals({ "true": ["string"] }, argebr);
                            proxy['interface.ebv'].Methodebv(onReplyebv, callbacks.addErrback('argebr', onError), { "true": { s: "string" } });
                        });
                    var onReplyebv = callbacks.add(function(context, argebv) {
                            assertEquals({ "true": "string" }, argebv);
                            proxy['interface.edb'].Methodedb(onReplyedb, callbacks.addErrback('argebv', onError), { "1.234": true });
                        });
                    var onReplyedb = callbacks.add(function(context, argedb) {
                            assertEquals({ "1.234": true }, argedb);
                            proxy['interface.edd'].Methodedd(onReplyedd, callbacks.addErrback('argedb', onError), { "1.234": 1.234 });
                        });
                    var onReplyedd = callbacks.add(function(context, argedd) {
                            assertEquals({ "1.234": 1.234 }, argedd);
                            proxy['interface.edg'].Methodedg(onReplyedg, callbacks.addErrback('argedd', onError), { "1.234": "sig" });
                        });
                    var onReplyedg = callbacks.add(function(context, argedg) {
                            assertEquals({ "1.234": "sig" }, argedg);
                            proxy['interface.edi'].Methodedi(onReplyedi, callbacks.addErrback('argedg', onError), { "1.234": -1 });
                        });
                    var onReplyedi = callbacks.add(function(context, argedi) {
                            assertEquals({ "1.234": -1 }, argedi);
                            proxy['interface.edn'].Methodedn(onReplyedn, callbacks.addErrback('argedi', onError), { "1.234": -2 });
                        });
                    var onReplyedn = callbacks.add(function(context, argedn) {
                            assertEquals({ "1.234": -2 }, argedn);
                            proxy['interface.edo'].Methodedo(onReplyedo, callbacks.addErrback('argedn', onError), { "1.234": "/path" });
                        });
                    var onReplyedo = callbacks.add(function(context, argedo) {
                            assertEquals({ "1.234": "/path" }, argedo);
                            proxy['interface.edq'].Methodedq(onReplyedq, callbacks.addErrback('argedo', onError), { "1.234": 3 });
                        });
                    var onReplyedq = callbacks.add(function(context, argedq) {
                            assertEquals({ "1.234": 3 }, argedq);
                            proxy['interface.eds'].Methodeds(onReplyeds, callbacks.addErrback('argedq', onError), { "1.234": "string" });
                        });
                    var onReplyeds = callbacks.add(function(context, argeds) {
                            assertEquals({ "1.234": "string" }, argeds);
                            proxy['interface.edt'].Methodedt(onReplyedt, callbacks.addErrback('argeds', onError), { "1.234": 4 });
                        });
                    var onReplyedt = callbacks.add(function(context, argedt) {
                            argedt["1.234"] = parseInt(argedt["1.234"]);
                            assertEquals({ "1.234": 4 }, argedt);
                            proxy['interface.edu'].Methodedu(onReplyedu, callbacks.addErrback('argedt', onError), { "1.234": 5 });
                        });
                    var onReplyedu = callbacks.add(function(context, argedu) {
                            assertEquals({ "1.234": 5 }, argedu);
                            proxy['interface.edx'].Methodedx(onReplyedx, callbacks.addErrback('argedu', onError), { "1.234": -6 });
                        });
                    var onReplyedx = callbacks.add(function(context, argedx) {
                            argedx["1.234"] = parseInt(argedx["1.234"]);
                            assertEquals({ "1.234": -6 }, argedx);
                            proxy['interface.edy'].Methodedy(onReplyedy, callbacks.addErrback('argedx', onError), { "1.234": 7 });
                        });
                    var onReplyedy = callbacks.add(function(context, argedy) {
                            assertEquals({ "1.234": 7 }, argedy);
                            proxy['interface.edas'].Methodedas(onReplyedas, callbacks.addErrback('argedy', onError), { "1.234": ["s0", "s1"] });
                        });
                    var onReplyedas = callbacks.add(function(context, argedas) {
                            assertEquals({ "1.234": ["s0", "s1"] }, argedas);
                            proxy['interface.ede'].Methodede(onReplyede, callbacks.addErrback('argedas', onError), { "1.234": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyede = callbacks.add(function(context, argede) {
                            assertEquals({ "1.234": { key0: "value0", key1: "value1" } }, argede);
                            proxy['interface.edr'].Methodedr(onReplyedr, callbacks.addErrback('argede', onError), { "1.234": ["string"] });
                        });
                    var onReplyedr = callbacks.add(function(context, argedr) {
                            assertEquals({ "1.234": ["string"] }, argedr);
                            proxy['interface.edv'].Methodedv(onReplyedv, callbacks.addErrback('argedr', onError), { "1.234": { s: "string" } });
                        });
                    var onReplyedv = callbacks.add(function(context, argedv) {
                            assertEquals({ "1.234": "string" }, argedv);
                            proxy['interface.egb'].Methodegb(onReplyegb, callbacks.addErrback('argedv', onError), { "sig": true });
                        });
                    var onReplyegb = callbacks.add(function(context, argegb) {
                            assertEquals({ "sig": true }, argegb);
                            proxy['interface.egd'].Methodegd(onReplyegd, callbacks.addErrback('argegb', onError), { "sig": 1.234 });
                        });
                    var onReplyegd = callbacks.add(function(context, argegd) {
                            assertEquals({ "sig": 1.234 }, argegd);
                            proxy['interface.egg'].Methodegg(onReplyegg, callbacks.addErrback('argegd', onError), { "sig": "sig" });
                        });
                    var onReplyegg = callbacks.add(function(context, argegg) {
                            assertEquals({ "sig": "sig" }, argegg);
                            proxy['interface.egi'].Methodegi(onReplyegi, callbacks.addErrback('argegg', onError), { "sig": -1 });
                        });
                    var onReplyegi = callbacks.add(function(context, argegi) {
                            assertEquals({ "sig": -1 }, argegi);
                            proxy['interface.egn'].Methodegn(onReplyegn, callbacks.addErrback('argegi', onError), { "sig": -2 });
                        });
                    var onReplyegn = callbacks.add(function(context, argegn) {
                            assertEquals({ "sig": -2 }, argegn);
                            proxy['interface.ego'].Methodego(onReplyego, callbacks.addErrback('argegn', onError), { "sig": "/path" });
                        });
                    var onReplyego = callbacks.add(function(context, argego) {
                            assertEquals({ "sig": "/path" }, argego);
                            proxy['interface.egq'].Methodegq(onReplyegq, callbacks.addErrback('argego', onError), { "sig": 3 });
                        });
                    var onReplyegq = callbacks.add(function(context, argegq) {
                            assertEquals({ "sig": 3 }, argegq);
                            proxy['interface.egs'].Methodegs(onReplyegs, callbacks.addErrback('argegq', onError), { "sig": "string" });
                        });
                    var onReplyegs = callbacks.add(function(context, argegs) {
                            assertEquals({ "sig": "string" }, argegs);
                            proxy['interface.egt'].Methodegt(onReplyegt, callbacks.addErrback('argegs', onError), { "sig": 4 });
                        });
                    var onReplyegt = callbacks.add(function(context, argegt) {
                            argegt["sig"] = parseInt(argegt["sig"]);
                            assertEquals({ "sig": 4 }, argegt);
                            proxy['interface.egu'].Methodegu(onReplyegu, callbacks.addErrback('argegt', onError), { "sig": 5 });
                        });
                    var onReplyegu = callbacks.add(function(context, argegu) {
                            assertEquals({ "sig": 5 }, argegu);
                            proxy['interface.egx'].Methodegx(onReplyegx, callbacks.addErrback('argegu', onError), { "sig": -6 });
                        });
                    var onReplyegx = callbacks.add(function(context, argegx) {
                            argegx["sig"] = parseInt(argegx["sig"]);
                            assertEquals({ "sig": -6 }, argegx);
                            proxy['interface.egy'].Methodegy(onReplyegy, callbacks.addErrback('argegx', onError), { "sig": 7 });
                        });
                    var onReplyegy = callbacks.add(function(context, argegy) {
                            assertEquals({ "sig": 7 }, argegy);
                            proxy['interface.egas'].Methodegas(onReplyegas, callbacks.addErrback('argegy', onError), { "sig": ["s0", "s1"] });
                        });
                    var onReplyegas = callbacks.add(function(context, argegas) {
                            assertEquals({ "sig": ["s0", "s1"] }, argegas);
                            proxy['interface.ege'].Methodege(onReplyege, callbacks.addErrback('argegas', onError), { "sig": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyege = callbacks.add(function(context, argege) {
                            assertEquals({ "sig": { key0: "value0", key1: "value1" } }, argege);
                            proxy['interface.egr'].Methodegr(onReplyegr, callbacks.addErrback('argege', onError), { "sig": ["string"] });
                        });
                    var onReplyegr = callbacks.add(function(context, argegr) {
                            assertEquals({ "sig": ["string"] }, argegr);
                            proxy['interface.egv'].Methodegv(onReplyegv, callbacks.addErrback('argegr', onError), { "sig": { s: "string" } });
                        });
                    var onReplyegv = callbacks.add(function(context, argegv) {
                            assertEquals({ "sig": "string" }, argegv);
                            proxy['interface.eib'].Methodeib(onReplyeib, callbacks.addErrback('argegv', onError), { "-1": true });
                        });
                    var onReplyeib = callbacks.add(function(context, argeib) {
                            assertEquals({ "-1": true }, argeib);
                            proxy['interface.eid'].Methodeid(onReplyeid, callbacks.addErrback('argeib', onError), { "-1": 1.234 });
                        });
                    var onReplyeid = callbacks.add(function(context, argeid) {
                            assertEquals({ "-1": 1.234 }, argeid);
                            proxy['interface.eig'].Methodeig(onReplyeig, callbacks.addErrback('argeid', onError), { "-1": "sig" });
                        });
                    var onReplyeig = callbacks.add(function(context, argeig) {
                            assertEquals({ "-1": "sig" }, argeig);
                            proxy['interface.eii'].Methodeii(onReplyeii, callbacks.addErrback('argeig', onError), { "-1": -1 });
                        });
                    var onReplyeii = callbacks.add(function(context, argeii) {
                            assertEquals({ "-1": -1 }, argeii);
                            proxy['interface.ein'].Methodein(onReplyein, callbacks.addErrback('argeii', onError), { "-1": -2 });
                        });
                    var onReplyein = callbacks.add(function(context, argein) {
                            assertEquals({ "-1": -2 }, argein);
                            proxy['interface.eio'].Methodeio(onReplyeio, callbacks.addErrback('argein', onError), { "-1": "/path" });
                        });
                    var onReplyeio = callbacks.add(function(context, argeio) {
                            assertEquals({ "-1": "/path" }, argeio);
                            proxy['interface.eiq'].Methodeiq(onReplyeiq, callbacks.addErrback('argeio', onError), { "-1": 3 });
                        });
                    var onReplyeiq = callbacks.add(function(context, argeiq) {
                            assertEquals({ "-1": 3 }, argeiq);
                            proxy['interface.eis'].Methodeis(onReplyeis, callbacks.addErrback('argeiq', onError), { "-1": "string" });
                        });
                    var onReplyeis = callbacks.add(function(context, argeis) {
                            assertEquals({ "-1": "string" }, argeis);
                            proxy['interface.eit'].Methodeit(onReplyeit, callbacks.addErrback('argeis', onError), { "-1": 4 });
                        });
                    var onReplyeit = callbacks.add(function(context, argeit) {
                            argeit["-1"] = parseInt(argeit["-1"]);
                            assertEquals({ "-1": 4 }, argeit);
                            proxy['interface.eiu'].Methodeiu(onReplyeiu, callbacks.addErrback('argeit', onError), { "-1": 5 });
                        });
                    var onReplyeiu = callbacks.add(function(context, argeiu) {
                            assertEquals({ "-1": 5 }, argeiu);
                            proxy['interface.eix'].Methodeix(onReplyeix, callbacks.addErrback('argeiu', onError), { "-1": -6 });
                        });
                    var onReplyeix = callbacks.add(function(context, argeix) {
                            argeix["-1"] = parseInt(argeix["-1"]);
                            assertEquals({ "-1": -6 }, argeix);
                            proxy['interface.eiy'].Methodeiy(onReplyeiy, callbacks.addErrback('argeix', onError), { "-1": 7 });
                        });
                    var onReplyeiy = callbacks.add(function(context, argeiy) {
                            assertEquals({ "-1": 7 }, argeiy);
                            proxy['interface.eias'].Methodeias(onReplyeias, callbacks.addErrback('argeiy', onError), { "-1": ["s0", "s1"] });
                        });
                    var onReplyeias = callbacks.add(function(context, argeias) {
                            assertEquals({ "-1": ["s0", "s1"] }, argeias);
                            proxy['interface.eie'].Methodeie(onReplyeie, callbacks.addErrback('argeias', onError), { "-1": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyeie = callbacks.add(function(context, argeie) {
                            assertEquals({ "-1": { key0: "value0", key1: "value1" } }, argeie);
                            proxy['interface.eir'].Methodeir(onReplyeir, callbacks.addErrback('argeie', onError), { "-1": ["string"] });
                        });
                    var onReplyeir = callbacks.add(function(context, argeir) {
                            assertEquals({ "-1": ["string"] }, argeir);
                            proxy['interface.eiv'].Methodeiv(onReplyeiv, callbacks.addErrback('argeir', onError), { "-1": { s: "string" } });
                        });
                    var onReplyeiv = callbacks.add(function(context, argeiv) {
                            assertEquals({ "-1": "string" }, argeiv);
                            proxy['interface.enb'].Methodenb(onReplyenb, callbacks.addErrback('argeiv', onError), { "-2": true });
                        });
                    var onReplyenb = callbacks.add(function(context, argenb) {
                            assertEquals({ "-2": true }, argenb);
                            proxy['interface.end'].Methodend(onReplyend, callbacks.addErrback('argenb', onError), { "-2": 1.234 });
                        });
                    var onReplyend = callbacks.add(function(context, argend) {
                            assertEquals({ "-2": 1.234 }, argend);
                            proxy['interface.eng'].Methodeng(onReplyeng, callbacks.addErrback('argend', onError), { "-2": "sig" });
                        });
                    var onReplyeng = callbacks.add(function(context, argeng) {
                            assertEquals({ "-2": "sig" }, argeng);
                            proxy['interface.eni'].Methodeni(onReplyeni, callbacks.addErrback('argeng', onError), { "-2": -1 });
                        });
                    var onReplyeni = callbacks.add(function(context, argeni) {
                            assertEquals({ "-2": -1 }, argeni);
                            proxy['interface.enn'].Methodenn(onReplyenn, callbacks.addErrback('argeni', onError), { "-2": -2 });
                        });
                    var onReplyenn = callbacks.add(function(context, argenn) {
                            assertEquals({ "-2": -2 }, argenn);
                            proxy['interface.eno'].Methodeno(onReplyeno, callbacks.addErrback('argenn', onError), { "-2": "/path" });
                        });
                    var onReplyeno = callbacks.add(function(context, argeno) {
                            assertEquals({ "-2": "/path" }, argeno);
                            proxy['interface.enq'].Methodenq(onReplyenq, callbacks.addErrback('argeno', onError), { "-2": 3 });
                        });
                    var onReplyenq = callbacks.add(function(context, argenq) {
                            assertEquals({ "-2": 3 }, argenq);
                            proxy['interface.ens'].Methodens(onReplyens, callbacks.addErrback('argenq', onError), { "-2": "string" });
                        });
                    var onReplyens = callbacks.add(function(context, argens) {
                            assertEquals({ "-2": "string" }, argens);
                            proxy['interface.ent'].Methodent(onReplyent, callbacks.addErrback('argens', onError), { "-2": 4 });
                        });
                    var onReplyent = callbacks.add(function(context, argent) {
                            argent["-2"] = parseInt(argent["-2"]);
                            assertEquals({ "-2": 4 }, argent);
                            proxy['interface.enu'].Methodenu(onReplyenu, callbacks.addErrback('argent', onError), { "-2": 5 });
                        });
                    var onReplyenu = callbacks.add(function(context, argenu) {
                            assertEquals({ "-2": 5 }, argenu);
                            proxy['interface.enx'].Methodenx(onReplyenx, callbacks.addErrback('argenu', onError), { "-2": -6 });
                        });
                    var onReplyenx = callbacks.add(function(context, argenx) {
                            argenx["-2"] = parseInt(argenx["-2"]);
                            assertEquals({ "-2": -6 }, argenx);
                            proxy['interface.eny'].Methodeny(onReplyeny, callbacks.addErrback('argenx', onError), { "-2": 7 });
                        });
                    var onReplyeny = callbacks.add(function(context, argeny) {
                            assertEquals({ "-2": 7 }, argeny);
                            proxy['interface.enas'].Methodenas(onReplyenas, callbacks.addErrback('argeny', onError), { "-2": ["s0", "s1"] });
                        });
                    var onReplyenas = callbacks.add(function(context, argenas) {
                            assertEquals({ "-2": ["s0", "s1"] }, argenas);
                            proxy['interface.ene'].Methodene(onReplyene, callbacks.addErrback('argenas', onError), { "-2": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyene = callbacks.add(function(context, argene) {
                            assertEquals({ "-2": { key0: "value0", key1: "value1" } }, argene);
                            proxy['interface.enr'].Methodenr(onReplyenr, callbacks.addErrback('argene', onError), { "-2": ["string"] });
                        });
                    var onReplyenr = callbacks.add(function(context, argenr) {
                            assertEquals({ "-2": ["string"] }, argenr);
                            proxy['interface.env'].Methodenv(onReplyenv, callbacks.addErrback('argenr', onError), { "-2": { s: "string" } });
                        });
                    var onReplyenv = callbacks.add(function(context, argenv) {
                            assertEquals({ "-2": "string" }, argenv);
                            proxy['interface.eob'].Methodeob(onReplyeob, callbacks.addErrback('argenv', onError), { "/path": true });
                        });
                    var onReplyeob = callbacks.add(function(context, argeob) {
                            assertEquals({ "/path": true }, argeob);
                            proxy['interface.eod'].Methodeod(onReplyeod, callbacks.addErrback('argeob', onError), { "/path": 1.234 });
                        });
                    var onReplyeod = callbacks.add(function(context, argeod) {
                            assertEquals({ "/path": 1.234 }, argeod);
                            proxy['interface.eog'].Methodeog(onReplyeog, callbacks.addErrback('argeod', onError), { "/path": "sig" });
                        });
                    var onReplyeog = callbacks.add(function(context, argeog) {
                            assertEquals({ "/path": "sig" }, argeog);
                            proxy['interface.eoi'].Methodeoi(onReplyeoi, callbacks.addErrback('argeog', onError), { "/path": -1 });
                        });
                    var onReplyeoi = callbacks.add(function(context, argeoi) {
                            assertEquals({ "/path": -1 }, argeoi);
                            proxy['interface.eon'].Methodeon(onReplyeon, callbacks.addErrback('argeoi', onError), { "/path": -2 });
                        });
                    var onReplyeon = callbacks.add(function(context, argeon) {
                            assertEquals({ "/path": -2 }, argeon);
                            proxy['interface.eoo'].Methodeoo(onReplyeoo, callbacks.addErrback('argeon', onError), { "/path": "/path" });
                        });
                    var onReplyeoo = callbacks.add(function(context, argeoo) {
                            assertEquals({ "/path": "/path" }, argeoo);
                            proxy['interface.eoq'].Methodeoq(onReplyeoq, callbacks.addErrback('argeoo', onError), { "/path": 3 });
                        });
                    var onReplyeoq = callbacks.add(function(context, argeoq) {
                            assertEquals({ "/path": 3 }, argeoq);
                            proxy['interface.eos'].Methodeos(onReplyeos, callbacks.addErrback('argeoq', onError), { "/path": "string" });
                        });
                    var onReplyeos = callbacks.add(function(context, argeos) {
                            assertEquals({ "/path": "string" }, argeos);
                            proxy['interface.eot'].Methodeot(onReplyeot, callbacks.addErrback('argeos', onError), { "/path": 4 });
                        });
                    var onReplyeot = callbacks.add(function(context, argeot) {
                            argeot["/path"] = parseInt(argeot["/path"]);
                            assertEquals({ "/path": 4 }, argeot);
                            proxy['interface.eou'].Methodeou(onReplyeou, callbacks.addErrback('argeot', onError), { "/path": 5 });
                        });
                    var onReplyeou = callbacks.add(function(context, argeou) {
                            assertEquals({ "/path": 5 }, argeou);
                            proxy['interface.eox'].Methodeox(onReplyeox, callbacks.addErrback('argeou', onError), { "/path": -6 });
                        });
                    var onReplyeox = callbacks.add(function(context, argeox) {
                            argeox["/path"] = parseInt(argeox["/path"]);
                            assertEquals({ "/path": -6 }, argeox);
                            proxy['interface.eoy'].Methodeoy(onReplyeoy, callbacks.addErrback('argeox', onError), { "/path": 7 });
                        });
                    var onReplyeoy = callbacks.add(function(context, argeoy) {
                            assertEquals({ "/path": 7 }, argeoy);
                            proxy['interface.eoas'].Methodeoas(onReplyeoas, callbacks.addErrback('argeoy', onError), { "/path": ["s0", "s1"] });
                        });
                    var onReplyeoas = callbacks.add(function(context, argeoas) {
                            assertEquals({ "/path": ["s0", "s1"] }, argeoas);
                            proxy['interface.eoe'].Methodeoe(onReplyeoe, callbacks.addErrback('argeoas', onError), { "/path": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyeoe = callbacks.add(function(context, argeoe) {
                            assertEquals({ "/path": { key0: "value0", key1: "value1" } }, argeoe);
                            proxy['interface.eor'].Methodeor(onReplyeor, callbacks.addErrback('argeoe', onError), { "/path": ["string"] });
                        });
                    var onReplyeor = callbacks.add(function(context, argeor) {
                            assertEquals({ "/path": ["string"] }, argeor);
                            proxy['interface.eov'].Methodeov(onReplyeov, callbacks.addErrback('argeor', onError), { "/path": { s: "string" } });
                        });
                    var onReplyeov = callbacks.add(function(context, argeov) {
                            assertEquals({ "/path": "string" }, argeov);
                            proxy['interface.eqb'].Methodeqb(onReplyeqb, callbacks.addErrback('argeov', onError), { "3": true });
                        });
                    var onReplyeqb = callbacks.add(function(context, argeqb) {
                            assertEquals({ "3": true }, argeqb);
                            proxy['interface.eqd'].Methodeqd(onReplyeqd, callbacks.addErrback('argeqb', onError), { "3": 1.234 });
                        });
                    var onReplyeqd = callbacks.add(function(context, argeqd) {
                            assertEquals({ "3": 1.234 }, argeqd);
                            proxy['interface.eqg'].Methodeqg(onReplyeqg, callbacks.addErrback('argeqd', onError), { "3": "sig" });
                        });
                    var onReplyeqg = callbacks.add(function(context, argeqg) {
                            assertEquals({ "3": "sig" }, argeqg);
                            proxy['interface.eqi'].Methodeqi(onReplyeqi, callbacks.addErrback('argeqg', onError), { "3": -1 });
                        });
                    var onReplyeqi = callbacks.add(function(context, argeqi) {
                            assertEquals({ "3": -1 }, argeqi);
                            proxy['interface.eqn'].Methodeqn(onReplyeqn, callbacks.addErrback('argeqi', onError), { "3": -2 });
                        });
                    var onReplyeqn = callbacks.add(function(context, argeqn) {
                            assertEquals({ "3": -2 }, argeqn);
                            proxy['interface.eqo'].Methodeqo(onReplyeqo, callbacks.addErrback('argeqn', onError), { "3": "/path" });
                        });
                    var onReplyeqo = callbacks.add(function(context, argeqo) {
                            assertEquals({ "3": "/path" }, argeqo);
                            proxy['interface.eqq'].Methodeqq(onReplyeqq, callbacks.addErrback('argeqo', onError), { "3": 3 });
                        });
                    var onReplyeqq = callbacks.add(function(context, argeqq) {
                            assertEquals({ "3": 3 }, argeqq);
                            proxy['interface.eqs'].Methodeqs(onReplyeqs, callbacks.addErrback('argeqq', onError), { "3": "string" });
                        });
                    var onReplyeqs = callbacks.add(function(context, argeqs) {
                            assertEquals({ "3": "string" }, argeqs);
                            proxy['interface.eqt'].Methodeqt(onReplyeqt, callbacks.addErrback('argeqs', onError), { "3": 4 });
                        });
                    var onReplyeqt = callbacks.add(function(context, argeqt) {
                            argeqt["3"] = parseInt(argeqt["3"]);
                            assertEquals({ "3": 4 }, argeqt);
                            proxy['interface.equ'].Methodequ(onReplyequ, callbacks.addErrback('argeqt', onError), { "3": 5 });
                        });
                    var onReplyequ = callbacks.add(function(context, argequ) {
                            assertEquals({ "3": 5 }, argequ);
                            proxy['interface.eqx'].Methodeqx(onReplyeqx, callbacks.addErrback('argequ', onError), { "3": -6 });
                        });
                    var onReplyeqx = callbacks.add(function(context, argeqx) {
                            argeqx["3"] = parseInt(argeqx["3"]);
                            assertEquals({ "3": -6 }, argeqx);
                            proxy['interface.eqy'].Methodeqy(onReplyeqy, callbacks.addErrback('argeqx', onError), { "3": 7 });
                        });
                    var onReplyeqy = callbacks.add(function(context, argeqy) {
                            assertEquals({ "3": 7 }, argeqy);
                            proxy['interface.eqas'].Methodeqas(onReplyeqas, callbacks.addErrback('argeqy', onError), { "3": ["s0", "s1"] });
                        });
                    var onReplyeqas = callbacks.add(function(context, argeqas) {
                            assertEquals({ "3": ["s0", "s1"] }, argeqas);
                            proxy['interface.eqe'].Methodeqe(onReplyeqe, callbacks.addErrback('argeqas', onError), { "3": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyeqe = callbacks.add(function(context, argeqe) {
                            assertEquals({ "3": { key0: "value0", key1: "value1" } }, argeqe);
                            proxy['interface.eqr'].Methodeqr(onReplyeqr, callbacks.addErrback('argeqe', onError), { "3": ["string"] });
                        });
                    var onReplyeqr = callbacks.add(function(context, argeqr) {
                            assertEquals({ "3": ["string"] }, argeqr);
                            proxy['interface.eqv'].Methodeqv(onReplyeqv, callbacks.addErrback('argeqr', onError), { "3": { s: "string" } });
                        });
                    var onReplyeqv = callbacks.add(function(context, argeqv) {
                            assertEquals({ "3": "string" }, argeqv);
                            proxy['interface.esb'].Methodesb(onReplyesb, callbacks.addErrback('argeqv', onError), { "string": true });
                        });
                    var onReplyesb = callbacks.add(function(context, argesb) {
                            assertEquals({ "string": true }, argesb);
                            proxy['interface.esd'].Methodesd(onReplyesd, callbacks.addErrback('argesb', onError), { "string": 1.234 });
                        });
                    var onReplyesd = callbacks.add(function(context, argesd) {
                            assertEquals({ "string": 1.234 }, argesd);
                            proxy['interface.esg'].Methodesg(onReplyesg, callbacks.addErrback('argesd', onError), { "string": "sig" });
                        });
                    var onReplyesg = callbacks.add(function(context, argesg) {
                            assertEquals({ "string": "sig" }, argesg);
                            proxy['interface.esi'].Methodesi(onReplyesi, callbacks.addErrback('argesg', onError), { "string": -1 });
                        });
                    var onReplyesi = callbacks.add(function(context, argesi) {
                            assertEquals({ "string": -1 }, argesi);
                            proxy['interface.esn'].Methodesn(onReplyesn, callbacks.addErrback('argesi', onError), { "string": -2 });
                        });
                    var onReplyesn = callbacks.add(function(context, argesn) {
                            assertEquals({ "string": -2 }, argesn);
                            proxy['interface.eso'].Methodeso(onReplyeso, callbacks.addErrback('argesn', onError), { "string": "/path" });
                        });
                    var onReplyeso = callbacks.add(function(context, argeso) {
                            assertEquals({ "string": "/path" }, argeso);
                            proxy['interface.esq'].Methodesq(onReplyesq, callbacks.addErrback('argeso', onError), { "string": 3 });
                        });
                    var onReplyesq = callbacks.add(function(context, argesq) {
                            assertEquals({ "string": 3 }, argesq);
                            proxy['interface.ess'].Methodess(onReplyess, callbacks.addErrback('argesq', onError), { "string": "string" });
                        });
                    var onReplyess = callbacks.add(function(context, argess) {
                            assertEquals({ "string": "string" }, argess);
                            proxy['interface.est'].Methodest(onReplyest, callbacks.addErrback('argess', onError), { "string": 4 });
                        });
                    var onReplyest = callbacks.add(function(context, argest) {
                            argest["string"] = parseInt(argest["string"]);
                            assertEquals({ "string": 4 }, argest);
                            proxy['interface.esu'].Methodesu(onReplyesu, callbacks.addErrback('argest', onError), { "string": 5 });
                        });
                    var onReplyesu = callbacks.add(function(context, argesu) {
                            assertEquals({ "string": 5 }, argesu);
                            proxy['interface.esx'].Methodesx(onReplyesx, callbacks.addErrback('argesu', onError), { "string": -6 });
                        });
                    var onReplyesx = callbacks.add(function(context, argesx) {
                            argesx["string"] = parseInt(argesx["string"]);
                            assertEquals({ "string": -6 }, argesx);
                            proxy['interface.esy'].Methodesy(onReplyesy, callbacks.addErrback('argesx', onError), { "string": 7 });
                        });
                    var onReplyesy = callbacks.add(function(context, argesy) {
                            assertEquals({ "string": 7 }, argesy);
                            proxy['interface.esas'].Methodesas(onReplyesas, callbacks.addErrback('argesy', onError), { "string": ["s0", "s1"] });
                        });
                    var onReplyesas = callbacks.add(function(context, argesas) {
                            assertEquals({ "string": ["s0", "s1"] }, argesas);
                            proxy['interface.ese'].Methodese(onReplyese, callbacks.addErrback('argesas', onError), { "string": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyese = callbacks.add(function(context, argese) {
                            assertEquals({ "string": { key0: "value0", key1: "value1" } }, argese);
                            proxy['interface.esr'].Methodesr(onReplyesr, callbacks.addErrback('argese', onError), { "string": ["string"] });
                        });
                    var onReplyesr = callbacks.add(function(context, argesr) {
                            assertEquals({ "string": ["string"] }, argesr);
                            proxy['interface.esv'].Methodesv(onReplyesv, callbacks.addErrback('argesr', onError), { "string": { s: "string" } });
                        });
                    var onReplyesv = callbacks.add(function(context, argesv) {
                            assertEquals({ "string": "string" }, argesv);
                            proxy['interface.etb'].Methodetb(onReplyetb, callbacks.addErrback('argesv', onError), { "4": true });
                        });
                    var onReplyetb = callbacks.add(function(context, argetb) {
                            assertEquals({ "4": true }, argetb);
                            proxy['interface.etd'].Methodetd(onReplyetd, callbacks.addErrback('argetb', onError), { "4": 1.234 });
                        });
                    var onReplyetd = callbacks.add(function(context, argetd) {
                            assertEquals({ "4": 1.234 }, argetd);
                            proxy['interface.etg'].Methodetg(onReplyetg, callbacks.addErrback('argetd', onError), { "4": "sig" });
                        });
                    var onReplyetg = callbacks.add(function(context, argetg) {
                            assertEquals({ "4": "sig" }, argetg);
                            proxy['interface.eti'].Methodeti(onReplyeti, callbacks.addErrback('argetg', onError), { "4": -1 });
                        });
                    var onReplyeti = callbacks.add(function(context, argeti) {
                            assertEquals({ "4": -1 }, argeti);
                            proxy['interface.etn'].Methodetn(onReplyetn, callbacks.addErrback('argeti', onError), { "4": -2 });
                        });
                    var onReplyetn = callbacks.add(function(context, argetn) {
                            assertEquals({ "4": -2 }, argetn);
                            proxy['interface.eto'].Methodeto(onReplyeto, callbacks.addErrback('argetn', onError), { "4": "/path" });
                        });
                    var onReplyeto = callbacks.add(function(context, argeto) {
                            assertEquals({ "4": "/path" }, argeto);
                            proxy['interface.etq'].Methodetq(onReplyetq, callbacks.addErrback('argeto', onError), { "4": 3 });
                        });
                    var onReplyetq = callbacks.add(function(context, argetq) {
                            assertEquals({ "4": 3 }, argetq);
                            proxy['interface.ets'].Methodets(onReplyets, callbacks.addErrback('argetq', onError), { "4": "string" });
                        });
                    var onReplyets = callbacks.add(function(context, argets) {
                            assertEquals({ "4": "string" }, argets);
                            proxy['interface.ett'].Methodett(onReplyett, callbacks.addErrback('argets', onError), { "4": 4 });
                        });
                    var onReplyett = callbacks.add(function(context, argett) {
                            argett["4"] = parseInt(argett["4"]);
                            assertEquals({ "4": 4 }, argett);
                            proxy['interface.etu'].Methodetu(onReplyetu, callbacks.addErrback('argett', onError), { "4": 5 });
                        });
                    var onReplyetu = callbacks.add(function(context, argetu) {
                            assertEquals({ "4": 5 }, argetu);
                            proxy['interface.etx'].Methodetx(onReplyetx, callbacks.addErrback('argetu', onError), { "4": -6 });
                        });
                    var onReplyetx = callbacks.add(function(context, argetx) {
                            argetx["4"] = parseInt(argetx["4"]);
                            assertEquals({ "4": -6 }, argetx);
                            proxy['interface.ety'].Methodety(onReplyety, callbacks.addErrback('argetx', onError), { "4": 7 });
                        });
                    var onReplyety = callbacks.add(function(context, argety) {
                            assertEquals({ "4": 7 }, argety);
                            proxy['interface.etas'].Methodetas(onReplyetas, callbacks.addErrback('argety', onError), { "4": ["s0", "s1"] });
                        });
                    var onReplyetas = callbacks.add(function(context, argetas) {
                            assertEquals({ "4": ["s0", "s1"] }, argetas);
                            proxy['interface.ete'].Methodete(onReplyete, callbacks.addErrback('argetas', onError), { "4": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyete = callbacks.add(function(context, argete) {
                            assertEquals({ "4": { key0: "value0", key1: "value1" } }, argete);
                            proxy['interface.etr'].Methodetr(onReplyetr, callbacks.addErrback('argete', onError), { "4": ["string"] });
                        });
                    var onReplyetr = callbacks.add(function(context, argetr) {
                            assertEquals({ "4": ["string"] }, argetr);
                            proxy['interface.etv'].Methodetv(onReplyetv, callbacks.addErrback('argetr', onError), { "4": { s: "string" } });
                        });
                    var onReplyetv = callbacks.add(function(context, argetv) {
                            assertEquals({ "4": "string" }, argetv);
                            proxy['interface.eub'].Methodeub(onReplyeub, callbacks.addErrback('argetv', onError), { "5": true });
                        });
                    var onReplyeub = callbacks.add(function(context, argeub) {
                            assertEquals({ "5": true }, argeub);
                            proxy['interface.eud'].Methodeud(onReplyeud, callbacks.addErrback('argeub', onError), { "5": 1.234 });
                        });
                    var onReplyeud = callbacks.add(function(context, argeud) {
                            assertEquals({ "5": 1.234 }, argeud);
                            proxy['interface.eug'].Methodeug(onReplyeug, callbacks.addErrback('argeud', onError), { "5": "sig" });
                        });
                    var onReplyeug = callbacks.add(function(context, argeug) {
                            assertEquals({ "5": "sig" }, argeug);
                            proxy['interface.eui'].Methodeui(onReplyeui, callbacks.addErrback('argeug', onError), { "5": -1 });
                        });
                    var onReplyeui = callbacks.add(function(context, argeui) {
                            assertEquals({ "5": -1 }, argeui);
                            proxy['interface.eun'].Methodeun(onReplyeun, callbacks.addErrback('argeui', onError), { "5": -2 });
                        });
                    var onReplyeun = callbacks.add(function(context, argeun) {
                            assertEquals({ "5": -2 }, argeun);
                            proxy['interface.euo'].Methodeuo(onReplyeuo, callbacks.addErrback('argeun', onError), { "5": "/path" });
                        });
                    var onReplyeuo = callbacks.add(function(context, argeuo) {
                            assertEquals({ "5": "/path" }, argeuo);
                            proxy['interface.euq'].Methodeuq(onReplyeuq, callbacks.addErrback('argeuo', onError), { "5": 3 });
                        });
                    var onReplyeuq = callbacks.add(function(context, argeuq) {
                            assertEquals({ "5": 3 }, argeuq);
                            proxy['interface.eus'].Methodeus(onReplyeus, callbacks.addErrback('argeuq', onError), { "5": "string" });
                        });
                    var onReplyeus = callbacks.add(function(context, argeus) {
                            assertEquals({ "5": "string" }, argeus);
                            proxy['interface.eut'].Methodeut(onReplyeut, callbacks.addErrback('argeus', onError), { "5": 4 });
                        });
                    var onReplyeut = callbacks.add(function(context, argeut) {
                            argeut["5"] = parseInt(argeut["5"]);
                            assertEquals({ "5": 4 }, argeut);
                            proxy['interface.euu'].Methodeuu(onReplyeuu, callbacks.addErrback('argeut', onError), { "5": 5 });
                        });
                    var onReplyeuu = callbacks.add(function(context, argeuu) {
                            assertEquals({ "5": 5 }, argeuu);
                            proxy['interface.eux'].Methodeux(onReplyeux, callbacks.addErrback('argeuu', onError), { "5": -6 });
                        });
                    var onReplyeux = callbacks.add(function(context, argeux) {
                            argeux["5"] = parseInt(argeux["5"]);
                            assertEquals({ "5": -6 }, argeux);
                            proxy['interface.euy'].Methodeuy(onReplyeuy, callbacks.addErrback('argeux', onError), { "5": 7 });
                        });
                    var onReplyeuy = callbacks.add(function(context, argeuy) {
                            assertEquals({ "5": 7 }, argeuy);
                            proxy['interface.euas'].Methodeuas(onReplyeuas, callbacks.addErrback('argeuy', onError), { "5": ["s0", "s1"] });
                        });
                    var onReplyeuas = callbacks.add(function(context, argeuas) {
                            assertEquals({ "5": ["s0", "s1"] }, argeuas);
                            proxy['interface.eue'].Methodeue(onReplyeue, callbacks.addErrback('argeuas', onError), { "5": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyeue = callbacks.add(function(context, argeue) {
                            assertEquals({ "5": { key0: "value0", key1: "value1" } }, argeue);
                            proxy['interface.eur'].Methodeur(onReplyeur, callbacks.addErrback('argeue', onError), { "5": ["string"] });
                        });
                    var onReplyeur = callbacks.add(function(context, argeur) {
                            assertEquals({ "5": ["string"] }, argeur);
                            proxy['interface.euv'].Methodeuv(onReplyeuv, callbacks.addErrback('argeur', onError), { "5": { s: "string" } });
                        });
                    var onReplyeuv = callbacks.add(function(context, argeuv) {
                            assertEquals({ "5": "string" }, argeuv);
                            proxy['interface.exb'].Methodexb(onReplyexb, callbacks.addErrback('argeuv', onError), { "-6": true });
                        });
                    var onReplyexb = callbacks.add(function(context, argexb) {
                            assertEquals({ "-6": true }, argexb);
                            proxy['interface.exd'].Methodexd(onReplyexd, callbacks.addErrback('argexb', onError), { "-6": 1.234 });
                        });
                    var onReplyexd = callbacks.add(function(context, argexd) {
                            assertEquals({ "-6": 1.234 }, argexd);
                            proxy['interface.exg'].Methodexg(onReplyexg, callbacks.addErrback('argexd', onError), { "-6": "sig" });
                        });
                    var onReplyexg = callbacks.add(function(context, argexg) {
                            assertEquals({ "-6": "sig" }, argexg);
                            proxy['interface.exi'].Methodexi(onReplyexi, callbacks.addErrback('argexg', onError), { "-6": -1 });
                        });
                    var onReplyexi = callbacks.add(function(context, argexi) {
                            assertEquals({ "-6": -1 }, argexi);
                            proxy['interface.exn'].Methodexn(onReplyexn, callbacks.addErrback('argexi', onError), { "-6": -2 });
                        });
                    var onReplyexn = callbacks.add(function(context, argexn) {
                            assertEquals({ "-6": -2 }, argexn);
                            proxy['interface.exo'].Methodexo(onReplyexo, callbacks.addErrback('argexn', onError), { "-6": "/path" });
                        });
                    var onReplyexo = callbacks.add(function(context, argexo) {
                            assertEquals({ "-6": "/path" }, argexo);
                            proxy['interface.exq'].Methodexq(onReplyexq, callbacks.addErrback('argexo', onError), { "-6": 3 });
                        });
                    var onReplyexq = callbacks.add(function(context, argexq) {
                            assertEquals({ "-6": 3 }, argexq);
                            proxy['interface.exs'].Methodexs(onReplyexs, callbacks.addErrback('argexq', onError), { "-6": "string" });
                        });
                    var onReplyexs = callbacks.add(function(context, argexs) {
                            assertEquals({ "-6": "string" }, argexs);
                            proxy['interface.ext'].Methodext(onReplyext, callbacks.addErrback('argexs', onError), { "-6": 4 });
                        });
                    var onReplyext = callbacks.add(function(context, argext) {
                            argext["-6"] = parseInt(argext["-6"]);
                            assertEquals({ "-6": 4 }, argext);
                            proxy['interface.exu'].Methodexu(onReplyexu, callbacks.addErrback('argext', onError), { "-6": 5 });
                        });
                    var onReplyexu = callbacks.add(function(context, argexu) {
                            assertEquals({ "-6": 5 }, argexu);
                            proxy['interface.exx'].Methodexx(onReplyexx, callbacks.addErrback('argexu', onError), { "-6": -6 });
                        });
                    var onReplyexx = callbacks.add(function(context, argexx) {
                            argexx["-6"] = parseInt(argexx["-6"]);
                            assertEquals({ "-6": -6 }, argexx);
                            proxy['interface.exy'].Methodexy(onReplyexy, callbacks.addErrback('argexx', onError), { "-6": 7 });
                        });
                    var onReplyexy = callbacks.add(function(context, argexy) {
                            assertEquals({ "-6": 7 }, argexy);
                            proxy['interface.exas'].Methodexas(onReplyexas, callbacks.addErrback('argexy', onError), { "-6": ["s0", "s1"] });
                        });
                    var onReplyexas = callbacks.add(function(context, argexas) {
                            assertEquals({ "-6": ["s0", "s1"] }, argexas);
                            proxy['interface.exe'].Methodexe(onReplyexe, callbacks.addErrback('argexas', onError), { "-6": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyexe = callbacks.add(function(context, argexe) {
                            assertEquals({ "-6": { key0: "value0", key1: "value1" } }, argexe);
                            proxy['interface.exr'].Methodexr(onReplyexr, callbacks.addErrback('argexe', onError), { "-6": ["string"] });
                        });
                    var onReplyexr = callbacks.add(function(context, argexr) {
                            assertEquals({ "-6": ["string"] }, argexr);
                            proxy['interface.exv'].Methodexv(onReplyexv, callbacks.addErrback('argexr', onError), { "-6": { s: "string" } });
                        });
                    var onReplyexv = callbacks.add(function(context, argexv) {
                            assertEquals({ "-6": "string" }, argexv);
                            proxy['interface.eyb'].Methodeyb(onReplyeyb, callbacks.addErrback('argexv', onError), { "7": true });
                        });
                    var onReplyeyb = callbacks.add(function(context, argeyb) {
                            assertEquals({ "7": true }, argeyb);
                            proxy['interface.eyd'].Methodeyd(onReplyeyd, callbacks.addErrback('argeyb', onError), { "7": 1.234 });
                        });
                    var onReplyeyd = callbacks.add(function(context, argeyd) {
                            assertEquals({ "7": 1.234 }, argeyd);
                            proxy['interface.eyg'].Methodeyg(onReplyeyg, callbacks.addErrback('argeyd', onError), { "7": "sig" });
                        });
                    var onReplyeyg = callbacks.add(function(context, argeyg) {
                            assertEquals({ "7": "sig" }, argeyg);
                            proxy['interface.eyi'].Methodeyi(onReplyeyi, callbacks.addErrback('argeyg', onError), { "7": -1 });
                        });
                    var onReplyeyi = callbacks.add(function(context, argeyi) {
                            assertEquals({ "7": -1 }, argeyi);
                            proxy['interface.eyn'].Methodeyn(onReplyeyn, callbacks.addErrback('argeyi', onError), { "7": -2 });
                        });
                    var onReplyeyn = callbacks.add(function(context, argeyn) {
                            assertEquals({ "7": -2 }, argeyn);
                            proxy['interface.eyo'].Methodeyo(onReplyeyo, callbacks.addErrback('argeyn', onError), { "7": "/path" });
                        });
                    var onReplyeyo = callbacks.add(function(context, argeyo) {
                            assertEquals({ "7": "/path" }, argeyo);
                            proxy['interface.eyq'].Methodeyq(onReplyeyq, callbacks.addErrback('argeyo', onError), { "7": 3 });
                        });
                    var onReplyeyq = callbacks.add(function(context, argeyq) {
                            assertEquals({ "7": 3 }, argeyq);
                            proxy['interface.eys'].Methodeys(onReplyeys, callbacks.addErrback('argeyq', onError), { "7": "string" });
                        });
                    var onReplyeys = callbacks.add(function(context, argeys) {
                            assertEquals({ "7": "string" }, argeys);
                            proxy['interface.eyt'].Methodeyt(onReplyeyt, callbacks.addErrback('argeys', onError), { "7": 4 });
                        });
                    var onReplyeyt = callbacks.add(function(context, argeyt) {
                            argeyt["7"] = parseInt(argeyt["7"]);
                            assertEquals({ "7": 4 }, argeyt);
                            proxy['interface.eyu'].Methodeyu(onReplyeyu, callbacks.addErrback('argeyt', onError), { "7": 5 });
                        });
                    var onReplyeyu = callbacks.add(function(context, argeyu) {
                            assertEquals({ "7": 5 }, argeyu);
                            proxy['interface.eyx'].Methodeyx(onReplyeyx, callbacks.addErrback('argeyu', onError), { "7": -6 });
                        });
                    var onReplyeyx = callbacks.add(function(context, argeyx) {
                            argeyx["7"] = parseInt(argeyx["7"]);
                            assertEquals({ "7": -6 }, argeyx);
                            proxy['interface.eyy'].Methodeyy(onReplyeyy, callbacks.addErrback('argeyx', onError), { "7": 7 });
                        });
                    var onReplyeyy = callbacks.add(function(context, argeyy) {
                            assertEquals({ "7": 7 }, argeyy);
                            proxy['interface.eyas'].Methodeyas(onReplyeyas, callbacks.addErrback('argeyy', onError), { "7": ["s0", "s1"] });
                        });
                    var onReplyeyas = callbacks.add(function(context, argeyas) {
                            assertEquals({ "7": ["s0", "s1"] }, argeyas);
                            proxy['interface.eye'].Methodeye(onReplyeye, callbacks.addErrback('argeyas', onError), { "7": { key0: "value0", key1: "value1" } });
                        });
                    var onReplyeye = callbacks.add(function(context, argeye) {
                            assertEquals({ "7": { key0: "value0", key1: "value1" } }, argeye);
                            proxy['interface.eyr'].Methodeyr(onReplyeyr, callbacks.addErrback('argeye', onError), { "7": ["string"] });
                        });
                    var onReplyeyr = callbacks.add(function(context, argeyr) {
                            assertEquals({ "7": ["string"] }, argeyr);
                            proxy['interface.eyv'].Methodeyv(onReplyeyv, callbacks.addErrback('argeyr', onError), { "7": { s: "string" } });
                        });
                    var onReplyeyv = callbacks.add(function(context, argeyv) {
                            assertEquals({ "7": "string" }, argeyv);
                        });
                    proxy['interface.ebb'].Methodebb(onReplyebb, callbacks.addErrback('argeyv', onError), { "true": true });
                });
        },

        testStruct: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());

                    bus.interfaces['interface.rb'] = { method: [ { name: 'Methodrb', signature: '(b)', returnSignature: '(b)' } ] };
                    bus.interfaces['interface.rd'] = { method: [ { name: 'Methodrd', signature: '(d)', returnSignature: '(d)' } ] };
                    bus.interfaces['interface.rg'] = { method: [ { name: 'Methodrg', signature: '(g)', returnSignature: '(g)' } ] };
                    bus.interfaces['interface.ri'] = { method: [ { name: 'Methodri', signature: '(i)', returnSignature: '(i)' } ] };
                    bus.interfaces['interface.rn'] = { method: [ { name: 'Methodrn', signature: '(n)', returnSignature: '(n)' } ] };
                    bus.interfaces['interface.ro'] = { method: [ { name: 'Methodro', signature: '(o)', returnSignature: '(o)' } ] };
                    bus.interfaces['interface.rq'] = { method: [ { name: 'Methodrq', signature: '(q)', returnSignature: '(q)' } ] };
                    bus.interfaces['interface.rs'] = { method: [ { name: 'Methodrs', signature: '(s)', returnSignature: '(s)' } ] };
                    bus.interfaces['interface.rt'] = { method: [ { name: 'Methodrt', signature: '(t)', returnSignature: '(t)' } ] };
                    bus.interfaces['interface.ru'] = { method: [ { name: 'Methodru', signature: '(u)', returnSignature: '(u)' } ] };
                    bus.interfaces['interface.rx'] = { method: [ { name: 'Methodrx', signature: '(x)', returnSignature: '(x)' } ] };
                    bus.interfaces['interface.ry'] = { method: [ { name: 'Methodry', signature: '(y)', returnSignature: '(y)' } ] };
                    bus.interfaces['interface.ras'] = { method: [ { name: 'Methodras', signature: '(as)', returnSignature: '(as)' } ] };
                    bus.interfaces['interface.re'] = { method: [ { name: 'Methodre', signature: '(a{ss})', returnSignature: '(a{ss})' } ] };
                    bus.interfaces['interface.rr'] = { method: [ { name: 'Methodrr', signature: '((s))', returnSignature: '((s))' } ] };
                    bus.interfaces['interface.rv'] = { method: [ { name: 'Methodrv', signature: '(v)', returnSignature: '(v)' } ] };

                    bus['/testObject'] = {
                        'interface.rb': { Methodrb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rd': { Methodrd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rg': { Methodrg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ri': { Methodri: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rn': { Methodrn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ro': { Methodro: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rq': { Methodrq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rs': { Methodrs: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rt': { Methodrt: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ru': { Methodru: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rx': { Methodrx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ry': { Methodry: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.ras': { Methodras: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.re': { Methodre: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rr': { Methodrr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                        'interface.rv': { 
                            Methodrv: function(context, arg) { 
                                var args = [];
                                for (var i = 0; i < arg.length; ++i) {
                                    args[i] = { 's': arg[i] };
                                }
                                assertEquals(0, context.reply(args)); 
                            } 
                        },
                    };

                    var onErr = callbacks.addErrback(onError);
                    var proxy = bus.proxy[bus.uniqueName + '/testObject'];
                    var onReplyrb = callbacks.add(function(context, argrb) {
                            assertEquals([ true ], argrb);
                            proxy['interface.rd'].Methodrd(onReplyrd, onErr, [ 1.234 ])
                        });
                    var onReplyrd = callbacks.add(function(context, argrd) {
                            assertEquals([ 1.234 ], argrd);
                            proxy['interface.rg'].Methodrg(onReplyrg, onErr, [ "sig" ])
                        });
                    var onReplyrg = callbacks.add(function(context, argrg) {
                            assertEquals([ "sig" ], argrg);
                            proxy['interface.ri'].Methodri(onReplyri, onErr, [ -1 ])
                        });
                    var onReplyri = callbacks.add(function(context, argri) {
                            assertEquals([ -1 ], argri);
                            proxy['interface.rn'].Methodrn(onReplyrn, onErr, [ -2 ])
                        });
                    var onReplyrn = callbacks.add(function(context, argrn) {
                            assertEquals([ -2 ], argrn);
                            proxy['interface.ro'].Methodro(onReplyro, onErr, [ "/path" ])
                        });
                    var onReplyro = callbacks.add(function(context, argro) {
                            assertEquals([ "/path" ], argro);
                            proxy['interface.rq'].Methodrq(onReplyrq, onErr, [ 3 ])
                        });
                    var onReplyrq = callbacks.add(function(context, argrq) {
                            assertEquals([ 3 ], argrq);
                            proxy['interface.rs'].Methodrs(onReplyrs, onErr, [ "string" ])
                        });
                    var onReplyrs = callbacks.add(function(context, argrs) {
                            assertEquals([ "string" ], argrs);
                            proxy['interface.rt'].Methodrt(onReplyrt, onErr, [ 4 ])
                        });
                    var onReplyrt = callbacks.add(function(context, argrt) {
                            argrt[0] = parseInt(argrt[0]);
                            assertEquals([ 4 ], argrt);
                            proxy['interface.ru'].Methodru(onReplyru, onErr, [ 5 ])
                        });
                    var onReplyru = callbacks.add(function(context, argru) {
                            assertEquals([ 5 ], argru);
                            proxy['interface.rx'].Methodrx(onReplyrx, onErr, [ -6 ])
                        });
                    var onReplyrx = callbacks.add(function(context, argrx) {
                            argrx[0] = parseInt(argrx[0]);
                            assertEquals([ -6 ], argrx);
                            proxy['interface.ry'].Methodry(onReplyry, onErr, [ 7 ])
                        });
                    var onReplyry = callbacks.add(function(context, argry) {
                            assertEquals([ 7 ], argry);
                            proxy['interface.ras'].Methodras(onReplyras, onErr, [ ["s0", "s1"] ])
                        });
                    var onReplyras = callbacks.add(function(context, argras) {
                            assertEquals([ ["s0", "s1"] ], argras);
                            proxy['interface.re'].Methodre(onReplyre, onErr, [ { key0: "value0", key1: "value1" } ])
                        });
                    var onReplyre = callbacks.add(function(context, argre) {
                            assertEquals([ { key0: "value0", key1: "value1" } ], argre);
                            proxy['interface.rr'].Methodrr(onReplyrr, onErr, [ ["string"] ])
                        });
                    var onReplyrr = callbacks.add(function(context, argrr) {
                            assertEquals([ ["string"] ], argrr);
                            proxy['interface.rv'].Methodrv(onReplyrv, onErr, [ { s: "string" } ])
                        });
                    var onReplyrv = callbacks.add(function(context, argrv) {
                            assertEquals([ "string" ], argrv);
                        });
                    proxy['interface.rb'].Methodrb(onReplyrb, onErr, [ true ]);
                });
        },

        testVariant: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());

                    bus.interfaces['interface.vb'] = { method: [ { name: 'Methodvb', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vd'] = { method: [ { name: 'Methodvd', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vg'] = { method: [ { name: 'Methodvg', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vi'] = { method: [ { name: 'Methodvi', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vn'] = { method: [ { name: 'Methodvn', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vo'] = { method: [ { name: 'Methodvo', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vq'] = { method: [ { name: 'Methodvq', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vs'] = { method: [ { name: 'Methodvs', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vt'] = { method: [ { name: 'Methodvt', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vu'] = { method: [ { name: 'Methodvu', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vx'] = { method: [ { name: 'Methodvx', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vy'] = { method: [ { name: 'Methodvy', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vas'] = { method: [ { name: 'Methodvas', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.ve'] = { method: [ { name: 'Methodve', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vr'] = { method: [ { name: 'Methodvr', signature: 'v', returnSignature: 'v' } ] };
                    bus.interfaces['interface.vv'] = { method: [ { name: 'Methodvv', signature: 'v', returnSignature: 'v' } ] };

                    bus['/testObject'] = {
                        'interface.vb': { Methodvb: function(context, arg) { assertEquals(0, context.reply({ 'b': arg })); } },
                        'interface.vd': { Methodvd: function(context, arg) { assertEquals(0, context.reply({ 'd': arg })); } },
                        'interface.vg': { Methodvg: function(context, arg) { assertEquals(0, context.reply({ 'g': arg })); } },
                        'interface.vi': { Methodvi: function(context, arg) { assertEquals(0, context.reply({ 'i': arg })); } },
                        'interface.vn': { Methodvn: function(context, arg) { assertEquals(0, context.reply({ 'n': arg })); } },
                        'interface.vo': { Methodvo: function(context, arg) { assertEquals(0, context.reply({ 'o': arg })); } },
                        'interface.vq': { Methodvq: function(context, arg) { assertEquals(0, context.reply({ 'q': arg })); } },
                        'interface.vs': { Methodvs: function(context, arg) { assertEquals(0, context.reply({ 's': arg })); } },
                        'interface.vt': { Methodvt: function(context, arg) { assertEquals(0, context.reply({ 't': arg })); } },
                        'interface.vu': { Methodvu: function(context, arg) { assertEquals(0, context.reply({ 'u': arg })); } },
                        'interface.vx': { Methodvx: function(context, arg) { assertEquals(0, context.reply({ 'x': arg })); } },
                        'interface.vy': { Methodvy: function(context, arg) { assertEquals(0, context.reply({ 'y': arg })); } },
                        'interface.vas': { Methodvas: function(context, arg) { assertEquals(0, context.reply({ 'as': arg })); } },
                        'interface.ve': { Methodve: function(context, arg) { assertEquals(0, context.reply({ 'a{ss}': arg })); } },
                        'interface.vr': { Methodvr: function(context, arg) { assertEquals(0, context.reply({ '(s)': arg })); } },
                        'interface.vv': { Methodvv: function(context, arg) { assertEquals(0, context.reply({ 'v': arg })); } },
                    };

                    var onErr = callbacks.addErrback(onError);
                    var proxy = bus.proxy[bus.uniqueName + '/testObject'];
                    var onReplyvb = callbacks.add(function(context, argvb) {
                            assertEquals(true, argvb);
                            proxy['interface.vd'].Methodvd(onReplyvd, onErr, { 'd': 1.234 });
                        });
                    var onReplyvd = callbacks.add(function(context, argvd) {
                            assertEquals(1.234, argvd);
                            proxy['interface.vg'].Methodvg(onReplyvg, onErr, { 'g': "sig" });
                        });
                    var onReplyvg = callbacks.add(function(context, argvg) {
                            assertEquals("sig", argvg);
                            proxy['interface.vi'].Methodvi(onReplyvi, onErr, { 'i': -1 });
                        });
                    var onReplyvi = callbacks.add(function(context, argvi) {
                            assertEquals(-1, argvi);
                            proxy['interface.vn'].Methodvn(onReplyvn, onErr, { 'n': -2 });
                        });
                    var onReplyvn = callbacks.add(function(context, argvn) {
                            assertEquals(-2, argvn);
                            proxy['interface.vo'].Methodvo(onReplyvo, onErr, { 'o': "/path" });
                        });
                    var onReplyvo = callbacks.add(function(context, argvo) {
                            assertEquals("/path", argvo);
                            proxy['interface.vq'].Methodvq(onReplyvq, onErr, { 'q': 3 });
                        });
                    var onReplyvq = callbacks.add(function(context, argvq) {
                            assertEquals(3, argvq);
                            proxy['interface.vs'].Methodvs(onReplyvs, onErr, { 's': "string" });
                        });
                    var onReplyvs = callbacks.add(function(context, argvs) {
                            assertEquals("string", argvs);
                            proxy['interface.vt'].Methodvt(onReplyvt, onErr, { 't': 4 });
                        });
                    var onReplyvt = callbacks.add(function(context, argvt) {
                            assertEquals(4, argvt);
                            proxy['interface.vu'].Methodvu(onReplyvu, onErr, { 'u': 5 });
                        });
                    var onReplyvu = callbacks.add(function(context, argvu) {
                            assertEquals(5, argvu);
                            proxy['interface.vx'].Methodvx(onReplyvx, onErr, { 'x': -6 });
                        });
                    var onReplyvx = callbacks.add(function(context, argvx) {
                            assertEquals(-6, argvx);
                            proxy['interface.vy'].Methodvy(onReplyvy, onErr, { 'y': 7 });
                        });
                    var onReplyvy = callbacks.add(function(context, argvy) {
                            assertEquals(7, argvy);
                            proxy['interface.vas'].Methodvas(onReplyvas, onErr, { 'as': ["s0", "s1"] });
                        });
                    var onReplyvas = callbacks.add(function(context, argvas) {
                            assertEquals(["s0", "s1"], argvas);
                            proxy['interface.ve'].Methodve(onReplyve, onErr, { 'a{ss}': { key0: "value0", key1: "value1" } });
                        });
                    var onReplyve = callbacks.add(function(context, argve) {
                            assertEquals({ key0: "value0", key1: "value1" }, argve);
                            proxy['interface.vr'].Methodvr(onReplyvr, onErr, { '(s)': ["string"] });
                        });
                    var onReplyvr = callbacks.add(function(context, argvr) {
                            assertEquals(["string"], argvr);
                            proxy['interface.vv'].Methodvv(onReplyvv, onErr, { 'v': { 's': "string" } });
                        });
                    var onReplyvv = callbacks.add(function(context, argvv) {
                            assertEquals({ 's': "string" }, argvv);
                        });
                    proxy['interface.vb'].Methodvb(onReplyvb, onErr, { 'b': true });
                });
        },
          
        testHandle: function(queue) {
            queue.call(function(callbacks) {
                    var fds = {};

                    var SESSION_PORT = 111;
                    var startSession = function() {
                        assertEquals(0, bus.connect());
                        assertEquals(0, bus.bindSessionPort({
                                    port: SESSION_PORT,
                                    traffic: alljoyn.SessionOpts.TRAFFIC_RAW_RELIABLE,
                                    transport: alljoyn.SessionOpts.TRANSPORT_LOCAL,
                                    onAccept: function(port, joiner, opts) { 
                                        return true; 
                                    },
                                    onJoined: callbacks.add(function(port, id, opts) {
                                        fds.server = bus.getSessionFd(id);
                                        if (fds.server && fds.client) {
                                            test();
                                        }
                                    })
                                }));
                    };
                    var joinSession = function() {
                        otherBus = new alljoyn.BusAttachment();
                        var onJoinSession = callbacks.add(function(id, opts) {
                            fds.client = otherBus.getSessionFd(id);
                            if (fds.server && fds.client) {
                                test();
                            }
                        });
                        assertEquals(0, otherBus.connect());
                        assertEquals(0, otherBus.joinSession(onJoinSession, callbacks.addErrback(onError), {
                                    host: bus.uniqueName,
                                    port: SESSION_PORT,
                                    traffic: alljoyn.SessionOpts.TRAFFIC_RAW_RELIABLE
                                }));
                    };

                    var test = function() {
                        bus.interfaces['interface.h'] = { method: [ { name: 'Methodh', signature: 'h', returnSignature: 'h' } ] };
                        bus.interfaces['interface.ah'] = { method: [ { name: 'Methodah', signature: 'ah', returnSignature: 'ah' } ] };
                        bus.interfaces['interface.ehb'] = { method: [ { name: 'Methodehb', signature: 'a{hb}', returnSignature: 'a{hb}' } ] };
                        bus.interfaces['interface.ehd'] = { method: [ { name: 'Methodehd', signature: 'a{hd}', returnSignature: 'a{hd}' } ] };
                        bus.interfaces['interface.ehg'] = { method: [ { name: 'Methodehg', signature: 'a{hg}', returnSignature: 'a{hg}' } ] };
                        bus.interfaces['interface.ehi'] = { method: [ { name: 'Methodehi', signature: 'a{hi}', returnSignature: 'a{hi}' } ] };
                        bus.interfaces['interface.ehn'] = { method: [ { name: 'Methodehn', signature: 'a{hn}', returnSignature: 'a{hn}' } ] };
                        bus.interfaces['interface.eho'] = { method: [ { name: 'Methodeho', signature: 'a{ho}', returnSignature: 'a{ho}' } ] };
                        bus.interfaces['interface.ehq'] = { method: [ { name: 'Methodehq', signature: 'a{hq}', returnSignature: 'a{hq}' } ] };
                        bus.interfaces['interface.ehs'] = { method: [ { name: 'Methodehs', signature: 'a{hs}', returnSignature: 'a{hs}' } ] };
                        bus.interfaces['interface.eht'] = { method: [ { name: 'Methodeht', signature: 'a{ht}', returnSignature: 'a{ht}' } ] };
                        bus.interfaces['interface.ehu'] = { method: [ { name: 'Methodehu', signature: 'a{hu}', returnSignature: 'a{hu}' } ] };
                        bus.interfaces['interface.ehx'] = { method: [ { name: 'Methodehx', signature: 'a{hx}', returnSignature: 'a{hx}' } ] };
                        bus.interfaces['interface.ehy'] = { method: [ { name: 'Methodehy', signature: 'a{hy}', returnSignature: 'a{hy}' } ] };
                        bus.interfaces['interface.ehas'] = { method: [ { name: 'Methodehas', signature: 'a{has}', returnSignature: 'a{has}' } ] };
                        bus.interfaces['interface.ehe'] = { method: [ { name: 'Methodehe', signature: 'a{ha{ss}}', returnSignature: 'a{ha{ss}}' } ] };
                        bus.interfaces['interface.ehr'] = { method: [ { name: 'Methodehr', signature: 'a{h(s)}', returnSignature: 'a{h(s)}' } ] };
                        bus.interfaces['interface.ehv'] = { method: [ { name: 'Methodehv', signature: 'a{hv}', returnSignature: 'a{hv}' } ] };
                        bus.interfaces['interface.rh'] = { method: [ { name: 'Methodrh', signature: '(h)', returnSignature: '(h)' } ] };
                        bus.interfaces['interface.vh'] = { method: [ { name: 'Methodvh', signature: 'v', returnSignature: 'v' } ] };

                        bus['/testObject'] = {
                            'interface.h': { Methodh: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ah': { Methodah: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehb': { Methodehb: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehd': { Methodehd: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehg': { Methodehg: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehi': { Methodehi: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehn': { Methodehn: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.eho': { Methodeho: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehq': { Methodehq: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehs': { Methodehs: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.eht': { Methodeht: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehu': { Methodehu: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehx': { Methodehx: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehy': { Methodehy: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehas': { Methodehas: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehe': { Methodehe: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehr': { Methodehr: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.ehv': {
                                Methodehv: function(context, arg) {
                                    var args = {};
                                    for (var name in arg) {
                                        args[name] = { 's': arg[name] };
                                    }
                                    assertEquals(0, context.reply(args));
                                },
                            },
                            'interface.rh': { Methodrh: function(context, arg) { assertEquals(0, context.reply(arg)); } },
                            'interface.vh': { Methodvh: function(context, arg) { assertEquals(0, context.reply({ 'h': arg })); } },
                        };

                        var proxy = bus.proxy[bus.uniqueName + '/testObject'];
                        var onReplyh = callbacks.add(function(context, argh) {
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                argh.recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                proxy['interface.ah'].Methodah(onReplyah, callbacks.addErrback('argah', onError), [ fds.server, fds.server ])
                            });
                        var onReplyah = callbacks.add(function(context, argah) {
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                argah[1].recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehb = {};
                                ehb[fds.server.fd] = true;
                                proxy['interface.ehb'].Methodehb(onReplyehb, callbacks.addErrback('argehb', onError), ehb);
                            });
                        var onReplyehb = callbacks.add(function(context, argehb) {
                                for (var fd in argehb) { break; }
                                assertEquals(true, argehb[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehd = {};
                                ehd[fds.server.fd] = 1.234;
                                proxy['interface.ehd'].Methodehd(onReplyehd, callbacks.addErrback('argehd', onError), ehd);
                            });
                        var onReplyehd = callbacks.add(function(context, argehd) {
                                for (var fd in argehd) { break; }
                                assertEquals(1.234, argehd[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehg = {};
                                ehg[fds.server.fd] = "sig";
                                proxy['interface.ehg'].Methodehg(onReplyehg, callbacks.addErrback('argehg', onError), ehg);
                            });
                        var onReplyehg = callbacks.add(function(context, argehg) {
                                for (var fd in argehg) { break; }
                                assertEquals("sig", argehg[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehi = {};
                                ehi[fds.server.fd] = -1;
                                proxy['interface.ehi'].Methodehi(onReplyehi, callbacks.addErrback('argehi', onError), ehi);
                            });
                        var onReplyehi = callbacks.add(function(context, argehi) {
                                for (var fd in argehi) { break; }
                                assertEquals(-1, argehi[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehn = {};
                                ehn[fds.server.fd] = -2;
                                proxy['interface.ehn'].Methodehn(onReplyehn, callbacks.addErrback('argehn', onError), ehn);
                            });
                        var onReplyehn = callbacks.add(function(context, argehn) {
                                for (var fd in argehn) { break; }
                                assertEquals(-2, argehn[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var eho = {};
                                eho[fds.server.fd] = "/path";
                                proxy['interface.eho'].Methodeho(onReplyeho, callbacks.addErrback('argeho', onError), eho);
                            });
                        var onReplyeho = callbacks.add(function(context, argeho) {
                                for (var fd in argeho) { break; }
                                assertEquals("/path", argeho[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehq = {};
                                ehq[fds.server.fd] = 3;
                                proxy['interface.ehq'].Methodehq(onReplyehq, callbacks.addErrback('argehq', onError), ehq);
                            });
                        var onReplyehq = callbacks.add(function(context, argehq) {
                                for (var fd in argehq) { break; }
                                assertEquals(3, argehq[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehs = {};
                                ehs[fds.server.fd] = "string";
                                proxy['interface.ehs'].Methodehs(onReplyehs, callbacks.addErrback('argehs', onError), ehs);
                            });
                        var onReplyehs = callbacks.add(function(context, argehs) {
                                for (var fd in argehs) { break; }
                                assertEquals("string", argehs[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var eht = {};
                                eht[fds.server.fd] = 4;
                                proxy['interface.eht'].Methodeht(onReplyeht, callbacks.addErrback('argeht', onError), eht);
                            });
                        var onReplyeht = callbacks.add(function(context, argeht) {
                                for (var fd in argeht) { break; }
                                assertEquals(4, argeht[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehu = {};
                                ehu[fds.server.fd] = 5;
                                proxy['interface.ehu'].Methodehu(onReplyehu, callbacks.addErrback('argehu', onError), ehu);
                            });
                        var onReplyehu = callbacks.add(function(context, argehu) {
                                for (var fd in argehu) { break; }
                                assertEquals(5, argehu[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehx = {};
                                ehx[fds.server.fd] = -6;
                                proxy['interface.ehx'].Methodehx(onReplyehx, callbacks.addErrback('argehx', onError), ehx);
                            });
                        var onReplyehx = callbacks.add(function(context, argehx) {
                                for (var fd in argehx) { break; }
                                assertEquals(-6, argehx[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehy = {};
                                ehy[fds.server.fd] = 7;
                                proxy['interface.ehy'].Methodehy(onReplyehy, callbacks.addErrback('argehy', onError), ehy);
                            });
                        var onReplyehy = callbacks.add(function(context, argehy) {
                                for (var fd in argehy) { break; }
                                assertEquals(7, argehy[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehas = {};
                                ehas[fds.server.fd] = ["s0", "s1"];
                                proxy['interface.ehas'].Methodehas(onReplyehas, callbacks.addErrback('argehas', onError), ehas);
                            });
                        var onReplyehas = callbacks.add(function(context, argehas) {
                                for (var fd in argehas) { break; }
                                assertEquals(["s0", "s1"], argehas[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehe = {};
                                ehe[fds.server.fd] = { key0: "value0", key1: "value1" };
                                proxy['interface.ehe'].Methodehe(onReplyehe, callbacks.addErrback('argehe', onError), ehe);
                            });
                        var onReplyehe = callbacks.add(function(context, argehe) {
                                for (var fd in argehe) { break; }
                                assertEquals({ key0: "value0", key1: "value1" }, argehe[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehr = {};
                                ehr[fds.server.fd] = ["string"];
                                proxy['interface.ehr'].Methodehr(onReplyehr, callbacks.addErrback('argehr', onError), ehr);
                            });
                        var onReplyehr = callbacks.add(function(context, argehr) {
                                for (var fd in argehr) { break; }
                                assertEquals(["string"], argehr[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                var ehv = {};
                                ehv[fds.server.fd] = { "s": "string" };
                                proxy['interface.ehv'].Methodehv(onReplyehv, callbacks.addErrback('argehv', onError), ehv);
                            });
                        var onReplyehv = callbacks.add(function(context, argehv) {
                                for (var fd in argehv) { break; }
                                assertEquals("string", argehv[fd]);
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                new alljoyn.SocketFd(fd).recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                proxy['interface.rh'].Methodrh(onReplyrh, callbacks.addErrback('argrh', onError), [ fds.server ]);
                        });
                        var onReplyrh = callbacks.add(function(context, argrh) {
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                argrh[0].recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);

                                proxy['interface.vh'].Methodvh(onReplyvh, callbacks.addErrback('argvh', onError), { 'h': fds.server });
                        });
                        var onReplyvh = callbacks.add(function(context, argvh) {
                                assertEquals(4, fds.client.send([1, 2, 3, 4]));
                                var buf = new Array(4);
                                argvh.recv(buf);
                                assertEquals(buf, [1, 2, 3, 4]);
                        });
                        proxy['interface.h'].Methodh(onReplyh, callbacks.addErrback('argh', onError), fds.server);
                    };

                    startSession();
                    joinSession();
                });
        },
    });