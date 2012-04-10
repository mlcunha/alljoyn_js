# Copyright 2012, Qualcomm Innovation Center, Inc.
# 
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
# 
#        http://www.apache.org/licenses/LICENSE-2.0
# 
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
# 

TARGET = libnpalljoyn.so

.PHONY: all clean

all: npalljoyn

ifeq "$(INSTALLDIR)" ""
    $(error please run this from the directory above)
endif

ifeq "$(GECKO_BASE)" ""
    $(error GECKO_BASE is required.)
endif

CPPDEFINES+=-D__STDC_LIMIT_MACROS
INCLUDE+=-I$(GECKO_BASE)/include
LINKFLAGS += -shared

NPALLJOYN_CC_SRCS = $(wildcard *.cc)
NPALLJOYN_CC_SRCS += $(wildcard os/$(OS)/*.cc)
NPALLJOYN_CC_OBJS = $(patsubst %.cc,%.o,$(NPALLJOYN_CC_SRCS))

$(NPALLJOYN_CC_OBJS) : $(NPALLJOYN_CC_SRCS)
	$(CXX) $(CXXFLAGS) $(CPPDEFINES) $(INCLUDE) -c -o $@ $(patsubst %.o,%.cc,$@)

NPALLJOYN_C_SRCS = $(wildcard *.c)
NPALLJOYN_C_OBJS = $(patsubst %.c,%.o,$(NPALLJOYN_C_SRCS))

$(NPALLJOYN_C_OBJS) : $(NPALLJOYN_C_SRCS)
	$(CC) $(CFLAGS) $(CPPDEFINES) $(INCLUDE) -c -o $@ $(patsubst %.o,%.c,$@)

%.o:%.cc
	$(CXX) $(CXXFLAGS) $(CPPDEFINES) $(INCLUDE) -c -o $@ $<

npalljoyn: $(NPALLJOYN_CC_OBJS) $(NPALLJOYN_C_OBJS)
	$(CXX) -o $(TARGET) $(CXXFLAGS) $(CPPDEFINES) $(LINKFLAGS) $(INCLUDE) $(NPALLJOYN_CC_OBJS) $(NPALLJOYN_C_OBJS) $(ALLJOYNLIB) $(LIBS)
	cp $(TARGET) $(INSTALLDIR)/dist/js/lib

clean:
	@rm -f *.o *~ $(TARGET) os/$(OS)/*.o

