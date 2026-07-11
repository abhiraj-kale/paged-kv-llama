cmake_minimum_required(VERSION 3.10)
project(llama2c C CXX)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Match the Makefile's `make run` target: gcc -O3 -o run run.c -lm
set(CMAKE_C_FLAGS_RELEASE "-O3")
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

add_executable(run run.c
        paged_cache.cpp
        paged_cache.hpp
        paged_cache_c_api.h
)
target_link_libraries(run m)

add_executable(runq runq.c)
target_link_libraries(runq m)
